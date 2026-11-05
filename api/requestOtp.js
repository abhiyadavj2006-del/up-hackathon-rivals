// Vercel serverless function: POST /requestOtp
// (also reachable as /api/requestOtp; vercel.json rewrites /requestOtp here)
const { generateOtp, isValidEmail, createOtpToken, sendOtpEmail, OTP_TTL_MS } = require('../lib/otp-service');

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });

  const { email } = req.body || {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, message: 'Valid email is required.' });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_TTL_MS;
  const token = createOtpToken(email, otp, expiresAt);

  try {
    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      // No email credentials configured: testing mode. The OTP is returned
      // so the flow can be tried end to end; set EMAIL_USER and EMAIL_PASS
      // to send real emails instead.
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
