// Vercel serverless function: POST /verifyOtp
// (also reachable as /api/verifyOtp; vercel.json rewrites /verifyOtp here)
const { verifyOtpToken } = require('../lib/otp-service');

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });

  const { email, otp, token } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ ok: false, message: 'Email and OTP are required.' });
  }

  const result = verifyOtpToken(token, email, otp);
  if (!result.valid) {
    return res.status(400).json({ ok: false, message: result.message });
  }
  return res.json({ ok: true, message: 'OTP verified successfully.' });
};
