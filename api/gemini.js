module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const region = process.env.VERCEL_REGION || 'unknown';
  res.setHeader('X-Vercel-Region', region);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'gemini-proxy',
      region: region,
      supported: region !== 'hkg1'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' }, region });
  }

  try {
    const model = req.query.model || 'gemini-2.5-flash';
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    const { apiKey, payload } = body;

    if (!apiKey || !payload) {
      return res.status(400).json({ error: { message: 'Missing apiKey or payload' }, region });
    }

    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const googleResp = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const rawText = await googleResp.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(502).json({
        error: {
          message: `Google 回傳非 JSON 格式 (${googleResp.status}): ${rawText.slice(0, 120)}`,
          vercelRegion: region
        }
      });
    }

    if (!googleResp.ok && data && data.error) {
      data.error.vercelRegion = region;
    }
    return res.status(googleResp.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message || 'Proxy error', vercelRegion: region } });
  }
};
