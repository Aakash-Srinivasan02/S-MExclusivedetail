exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, headers, body: 'Invalid JSON' };
  }

  const { name, phone, service, date, address, notes } = data;
  if (!name || !phone || !service || !date || !address) {
    return { statusCode: 400, headers, body: 'Missing required fields' };
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const SENDGRID_TO = process.env.SENDGRID_TO; // e.g. your email
  const SENDGRID_FROM = process.env.SENDGRID_FROM || 'no-reply@smexclusive.local';

  if (!SENDGRID_API_KEY || !SENDGRID_TO) {
    return { statusCode: 500, headers, body: 'Email service not configured' };
  }

  const payload = {
    personalizations: [
      {
        to: [{ email: SENDGRID_TO }],
        subject: `Booking request — ${service} (${name})`,
      },
    ],
    from: { email: SENDGRID_FROM, name: 'SM Exclusive Details' },
    content: [
      {
        type: 'text/plain',
        value: `New booking request:\n\nName: ${name}\nPhone: ${phone}\nService: ${service}\nDate: ${date}\nAddress: ${address}\nNotes: ${notes || ''}`,
      },
    ],
  };

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      return { statusCode: 502, headers, body: `SendGrid error: ${txt}` };
    }

    return { statusCode: 200, headers, body: 'ok' };
  } catch (err) {
    return { statusCode: 500, headers, body: `Server error: ${String(err)}` };
  }
};
