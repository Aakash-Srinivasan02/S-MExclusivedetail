const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_PRICE_MONTHLY_ID = process.env.STRIPE_PRICE_MONTHLY_ID; // optional
  const STRIPE_PRICE_PREMIUM_ID = process.env.STRIPE_PRICE_PREMIUM_ID; // optional
  const SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || 'https://your-site.com/success';
  const CANCEL_URL = process.env.STRIPE_CANCEL_URL || 'https://your-site.com/cancel';

  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Stripe not configured', hint: 'Set STRIPE_SECRET_KEY in your environment' }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { /* ignore */ }
  const plan = body.plan || body.priceId || 'monthly';

  // map plan keys to price IDs
  const priceMap = {
    monthly: STRIPE_PRICE_MONTHLY_ID,
    premium: STRIPE_PRICE_PREMIUM_ID,
  };
  const priceId = body.priceId || priceMap[plan] || STRIPE_PRICE_MONTHLY_ID;

  if (!priceId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No price configured', hint: 'Set STRIPE_PRICE_MONTHLY_ID or send priceId in the request body' }) };
  }

  try {
    // require Stripe lazily so local checks without the package don't crash
    const Stripe = require('stripe');
    const stripe = Stripe(STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) };
  }
};
