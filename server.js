const express = require('express');
const cors = require('cors');
const {
  generateOtp,
  isValidEmail,
  createOtpToken,
  verifyOtpToken,
  sendOtpEmail,
  OTP_TTL_MS,
} = require('./lib/otp-service');

const app = express();
const PORT = process.env.PORT || 3001;
// Fallback store for local use when no token is supplied (e.g. old clients).
// On Vercel the stateless signed token is used instead, because serverless
// function instances do not share memory.
const otpStore = new Map();

app.use(cors());
app.use(express.json());

const sendOtpHandler = async (req, res) => {
  const { email } = req.body || {};

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, message: 'Valid email is required.' });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_TTL_MS;
  otpStore.set(email.toLowerCase(), { otp, expiresAt });
  const token = createOtpToken(email, otp, expiresAt);

  try {
    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      return res.json({
        ok: true,
        preview: true,
        message: 'OTP ready for testing only. Set EMAIL_USER and EMAIL_PASS to send real email.',
        otp,
        token,
      });
    }
  } catch {
    return res.status(500).json({ ok: false, message: 'Unable to send email right now.' });
  }

  return res.json({ ok: true, message: 'OTP sent to your email.', token });
};

const verifyOtpHandler = (req, res) => {
  const { email, otp, token } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({ ok: false, message: 'Email and OTP are required.' });
  }

  // Stateless token path (Vercel serverless).
  if (token) {
    const result = verifyOtpToken(token, email, otp);
    if (!result.valid) {
      return res.status(400).json({ ok: false, message: result.message });
    }
    return res.json({ ok: true, message: 'OTP verified successfully.' });
  }

  // In-memory fallback (local server).
  const key = String(email).toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    return res.status(400).json({ ok: false, message: 'No OTP request found for this email.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ ok: false, message: 'OTP expired. Please request a new one.' });
  }

  if (String(record.otp) !== String(otp)) {
    return res.status(400).json({ ok: false, message: 'Invalid OTP.' });
  }

  otpStore.delete(key);
  return res.json({ ok: true, message: 'OTP verified successfully.' });
};

app.post('/api/send-otp', sendOtpHandler);
app.post('/requestOtp', sendOtpHandler);
app.post('/api/verify-otp', verifyOtpHandler);
app.post('/verifyOtp', verifyOtpHandler);
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'up-hackathon-rivals OTP backend' });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'running' });
});

app.listen(PORT, () => {
  console.log(`OTP backend running on http://localhost:${PORT}`);
});
