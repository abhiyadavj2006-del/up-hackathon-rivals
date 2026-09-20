const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;
const otpStore = new Map();

app.use(cors());
app.use(express.json());

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

app.post('/api/send-otp', (req, res) => {
  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: 'Valid email is required.' });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(email.toLowerCase(), { otp, expiresAt });

  const transporter = getTransporter();

  if (!transporter) {
    return res.json({
      ok: true,
      preview: true,
      message: 'OTP ready for testing only. Set EMAIL_USER and EMAIL_PASS to send real email.',
      otp
    });
  }

  transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Up Hackathon Rivals',
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`
  }, (error) => {
    if (error) {
      return res.status(500).json({ ok: false, message: 'Unable to send email right now.' });
    }

    return res.json({ ok: true, message: 'OTP sent to your email.' });
  });
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({ ok: false, message: 'Email and OTP are required.' });
  }

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
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'running' });
});

app.listen(PORT, () => {
  console.log(`OTP backend running on http://localhost:${PORT}`);
});
