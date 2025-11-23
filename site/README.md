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

Tell me which of the above you'd like next and I will scaffold the serverless functions and update the client accordingly.
