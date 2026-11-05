// Shared OTP logic used by both the Express server (server.js, local/Render)
// and the Vercel serverless functions (api/*.js).
//
// OTPs are stateless: instead of keeping them in server memory (which does
// not survive across serverless function instances), the OTP is sealed into
// a signed token (HMAC-SHA256 with OTP_SECRET). The frontend stores the
// token and sends it back with the verification request, so any function
// instance can verify it. Tokens expire after 5 minutes.
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const OTP_TTL_MS = 5 * 60 * 1000;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getSecret = () => process.env.OTP_SECRET || '';

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const unb64url = (str) => Buffer.from(str, 'base64url');

function createOtpToken(email, otp, expiresAt) {
  const secret = getSecret();
  if (!secret) return null;
  const payload = b64url(JSON.stringify({ email: email.toLowerCase(), otp, exp: expiresAt }));
  const sig = crypto.createHmac('sha256', secret).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

function verifyOtpToken(token, email, otp) {
  const secret = getSecret();
  if (!secret || !token || typeof token !== 'string') {
    return { valid: false, message: 'No OTP request found for this email.' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false, message: 'Invalid OTP.' };
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  let provided;
  try {
    provided = unb64url(sig);
  } catch {
    return { valid: false, message: 'Invalid OTP.' };
  }
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return { valid: false, message: 'Invalid OTP.' };
  }
  let data;
  try {
    data = JSON.parse(unb64url(payload).toString('utf8'));
  } catch {
    return { valid: false, message: 'Invalid OTP.' };
  }
  if (data.email !== String(email).toLowerCase()) {
    return { valid: false, message: 'Invalid OTP.' };
  }
  if (Date.now() > data.exp) {
    return { valid: false, message: 'OTP expired. Please request a new one.' };
  }
  if (String(data.otp) !== String(otp)) {
    return { valid: false, message: 'Invalid OTP.' };
  }
  return { valid: true };
}

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
};

const sendOtpEmail = (email, otp) =>
  new Promise((resolve, reject) => {
    const transporter = getTransporter();
    if (!transporter) return resolve(false);
    transporter.sendMail(
      {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Up Hackathon Rivals',
        text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      },
      (error) => (error ? reject(error) : resolve(true))
    );
  });

module.exports = {
  OTP_TTL_MS,
  generateOtp,
  isValidEmail,
  createOtpToken,
  verifyOtpToken,
  getTransporter,
  sendOtpEmail,
};
