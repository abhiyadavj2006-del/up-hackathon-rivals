// Vercel serverless function: GET /health
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json({ ok: true, status: 'running' });
};
