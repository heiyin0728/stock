module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    const model = req.query.model || 'gemini-2.5-flash';
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    const { apiKey, payload } = body;

    if (!apiKey || !payload) {
      return res.status(400).json({ error: { message: 'Missing apiKey or payload' } });
    }

    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const googleResp = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await googleResp.json();
    return res.status(googleResp.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message || 'Proxy error' } });
  }
};
