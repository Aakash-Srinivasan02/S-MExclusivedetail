const fs = require('fs');
const path = require('path');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_PATH = '/tmp/instagram_cache.json';

function readCache() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return {};
    const raw = fs.readFileSync(CACHE_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function writeCache(obj) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(obj), 'utf8');
  } catch (e) {
    // ignore cache write errors
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN; // long-lived token
  const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v17.0';
  const CACHE_TTL = parseInt(process.env.INSTAGRAM_CACHE_TTL || '300', 10); // seconds

  if (!INSTAGRAM_USER_ID || !INSTAGRAM_ACCESS_TOKEN) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Instagram Graph API not configured',
        hint: 'Set INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN in your Netlify environment variables (see site/README.md).'
      })
    };
  }

  const query = event.queryStringParameters || {};
  const limit = Math.min( parseInt(query.count || '8', 10), 50 );

  // Try cache first
  const cache = readCache();
  const cacheKey = `${INSTAGRAM_USER_ID}:${limit}:${GRAPH_API_VERSION}`;
  const now = Date.now();
  if (cache[cacheKey] && (now - cache[cacheKey].ts) < (CACHE_TTL * 1000)) {
    return { statusCode: 200, headers, body: JSON.stringify({ items: cache[cacheKey].items, cached: true }) };
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${INSTAGRAM_USER_ID}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API error', detail: txt }) };
    }
    const data = await res.json();
    const items = (data.data || []).map(i => ({
      id: i.id,
      url: i.media_url || i.thumbnail_url || null,
      permalink: i.permalink || null,
      type: i.media_type || 'IMAGE',
      caption: i.caption || null,
      timestamp: i.timestamp || null
    })).filter(x => x.url);

    // update cache
    cache[cacheKey] = { ts: now, items };
    try { writeCache(cache); } catch (e) { /* ignore */ }

    return { statusCode: 200, headers, body: JSON.stringify({ items, cached: false }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) };
  }
};
