exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN; // long-lived token

  if (!INSTAGRAM_USER_ID || !INSTAGRAM_ACCESS_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Instagram not configured' }) };
  }

  const query = event.queryStringParameters || {};
  const limit = parseInt(query.count || '8', 10);

  const url = `https://graph.facebook.com/v17.0/${INSTAGRAM_USER_ID}/media?fields=id,media_type,media_url,thumbnail_url,permalink&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API error', detail: txt }) };
    }
    const data = await res.json();
    // normalize items to an array of {url, permalink}
    const items = (data.data || []).map(i => ({
      url: i.media_url || i.thumbnail_url || null,
      permalink: i.permalink || null,
      type: i.media_type || 'IMAGE'
    })).filter(x => x.url);

    return { statusCode: 200, headers, body: JSON.stringify({ items }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) };
  }
};
