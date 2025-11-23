# Local preview

To preview the scaffolded website locally, run a static web server from the project root and open http://localhost:8000

Using Python 3 (works cross-platform):

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Files created:

- `index.html` — main page (dark luxury theme, hero, services, portfolio, booking, subscribe)
- `styles.css` — site styles
- `script.js` — JS: nav toggle, booking demo, gallery lightbox, subscribe placeholder

Next steps and deployment notes

- Local demo: the booking form is a front-end demo that logs booking data to console and shows a confirmation message. To accept real bookings you can:
	- Use a serverless form endpoint (Netlify Functions, Vercel Serverless, AWS Lambda) to capture submissions and send notifications.
	- Or use form services like Formspree, Getform, or Basin and point the form action to their endpoint.

- Subscriptions / Recurring billing:
	- For production subscriptions, integrate Stripe Checkout or Stripe Billing. You will need a server endpoint to create Checkout sessions or subscription objects. Example flow:
		1. Create a server endpoint `/create-checkout-session` that calls the Stripe API and returns a session ID.
		2. From the client, POST to that endpoint and redirect to `https://checkout.stripe.com/pay/<SESSION_ID>` or use the Stripe.js redirect.
	- Recommended deploy targets for quick serverless Stripe endpoints: Vercel, Netlify, or Azure Functions.

- Environment variables (example):
	- `STRIPE_SECRET_KEY` — your Stripe secret key used on the server.
	- `STRIPE_PRICE_MONTHLY_ID` — price ID for the monthly plan.

- Quick deploy options:
	- GitHub Pages: fast for purely static site (no serverless), good for brochure sites.
	- Vercel / Netlify: supports serverless functions for Stripe and form handling; recommended for booking + subscriptions.

See below for a minimal serverless example (Node/Express style) you can adapt to Vercel or Netlify functions.

Example (Node) server endpoint sketch:

```js
// server/create-checkout-session.js (example)
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
module.exports = async (req, res) => {
	const {priceId} = req.body;
	const session = await stripe.checkout.sessions.create({
		mode: 'subscription',
		payment_method_types: ['card'],
		line_items: [{price: priceId, quantity: 1}],
		success_url: 'https://your-site.com/success',
		cancel_url: 'https://your-site.com',
	});
	res.json({id: session.id});
};
```

Once you have a server endpoint, update the client `.subscribe-btn` handlers to POST to your server and redirect to Stripe Checkout.

Customization tips

- Replace hero image/background with high-resolution glossy shots from your Instagram portfolio.
- Use consistent brand colors — update `--accent` in `styles.css`.
- Replace placeholder phone number in `script.js` (`tel:+1234567890`) with your business number.

If you want, I can:

- Implement a working serverless Stripe Checkout endpoint (Vercel/Netlify) and wire up the subscribe buttons.
- Add a serverless booking endpoint that emails booking requests to you.
- Improve portfolio layout, add lazy-loading and optimized image sizes.
 - Implement a working serverless Stripe Checkout endpoint (Vercel/Netlify) and wire up the subscribe buttons. I added a sample implementation:

	 - `netlify/functions/create-checkout-session.js` — creates Stripe Checkout sessions using `STRIPE_SECRET_KEY` and price IDs.

	 Environment variables required for Stripe:

	 - `STRIPE_SECRET_KEY` — your Stripe secret key (server-side)
	 - `STRIPE_PRICE_MONTHLY_ID` — Stripe Price ID for the monthly plan
	 - `STRIPE_PRICE_PREMIUM_ID` — Stripe Price ID for the premium plan (optional)
	 - `STRIPE_SUCCESS_URL` — redirect after successful checkout
	 - `STRIPE_CANCEL_URL` — redirect for cancelled checkout

	 The client already wires the `Subscribe` buttons to POST `{ "plan": "monthly" }` to `/.netlify/functions/create-checkout-session` and redirects the browser to the returned Checkout URL.

 - Add a serverless booking endpoint that emails booking requests to you.
 - Improve portfolio layout, add lazy-loading and optimized image sizes.

I scaffolded a Netlify booking function at `netlify/functions/booking.js` that accepts POST requests and forwards booking details to SendGrid. To enable it after deploying to Netlify, set these environment variables in your Netlify site settings:

- `SENDGRID_API_KEY` — your SendGrid API key
- `SENDGRID_TO` — email address to receive booking notifications
- `SENDGRID_FROM` — optional from address for emails (default: `no-reply@smexclusive.local`)

Instagram integration (Netlify function)

I added `netlify/functions/instagram.js` to fetch recent posts from the official Instagram Graph API and return them to the client. The function expects these Netlify environment variables:

- `INSTAGRAM_USER_ID` — the numeric Instagram account ID (Business or Creator account)
- `INSTAGRAM_ACCESS_TOKEN` — a long-lived Instagram Graph API access token (required)
- Optional: `GRAPH_API_VERSION` — Graph API version (default: `v17.0`)
- Optional: `INSTAGRAM_CACHE_TTL` — cache TTL in seconds (default: `300`)

Important: the Instagram Graph API requires the Instagram account to be a Business or Creator account and connected to a Facebook Page.

Step-by-step: obtain `INSTAGRAM_USER_ID` and a long-lived `INSTAGRAM_ACCESS_TOKEN`

1. Convert the Instagram account to a Business or Creator account and link it to a Facebook Page (Instagram app settings).
2. Create a Facebook App at https://developers.facebook.com/apps and add the **Instagram Graph API** product.
3. In your App, add the necessary permissions (e.g. `instagram_basic`, `pages_read_engagement`) and generate a short-lived User Access Token via the Graph API Explorer or your app's OAuth flow.
4. Exchange the short-lived token for a long-lived token using the Graph API:

```bash
# replace <SHORT_LIVED_TOKEN> with the token from the Graph API Explorer
curl -X GET "https://graph.facebook.com/v17.0/oauth/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<SHORT_LIVED_TOKEN>"
```

The response will contain `access_token` (long-lived) and `expires_in`. Save the `access_token`.

5. Get the Instagram user ID for the connected account with:

```bash
curl -s "https://graph.facebook.com/v17.0/me/accounts?access_token=<LONG_LIVED_TOKEN>"
# or use the Instagram Business Account endpoint for the Page
```

Alternatively you can fetch the instagram account id with the Page id: (replace `<PAGE_ID>`)

```bash
curl -s "https://graph.facebook.com/v17.0/<PAGE_ID>?fields=instagram_business_account&access_token=<LONG_LIVED_TOKEN>"
```

6. In Netlify, open your Site > Site settings > Build & deploy > Environment > Environment variables, and add:

- `INSTAGRAM_USER_ID` = (the numeric ID)
- `INSTAGRAM_ACCESS_TOKEN` = (the long-lived token)
- (optional) `GRAPH_API_VERSION` = `v17.0` (or newer)
- (optional) `INSTAGRAM_CACHE_TTL` = `300`

7. Deploy the site (or run `netlify dev`) and test the endpoint in your browser:

```bash
curl "https://your-netlify-site.net/.netlify/functions/instagram?count=12"
```

Notes & alternatives
- Official Graph API is the recommended, supported approach and avoids fragile scraping. It requires the Facebook/Instagram app setup.
- If you need a quick non-API fallback (less stable), we previously experimented with an unauthenticated web endpoint; that approach can break due to UA checks and rate limits — not recommended for production.

If you'd like, I can:

- Walk through creating the Facebook App and exchanging the token (I can produce a checklist with exact Graph API Explorer steps).
- Add a small Netlify build-time check to validate the env vars and fail fast if misconfigured.

Notes:
- The booking form now POSTs to `/.netlify/functions/booking` and will show success/error messages in-page.
- If you prefer another email provider (Mailgun, SMTP), I can adapt the function.

Next steps I can take for you:

- Wire Stripe Checkout serverless endpoint and connect `.subscribe-btn` buttons.
- Adapt booking function to store bookings in a database (Airtable, Fauna, DynamoDB).
- Deploy the site to Netlify and verify functions end-to-end.

Tell me which of the above you'd like next or if you want Vercel/another provider instead.
