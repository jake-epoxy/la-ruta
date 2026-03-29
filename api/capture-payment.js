import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { paymentIntentId, driverStripeAccountId, driverFareExpected } = req.body;
  
  if (!paymentIntentId) return res.status(400).json({ error: 'Missing paymentIntentId.' });
  if (!driverStripeAccountId) return res.status(400).json({ error: 'Driver has no Stripe Connect Account.' });
  if (!driverFareExpected) return res.status(400).json({ error: 'Missing expected fare amount.' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // 1. Capture the hold from the Rider
    // If it was already captured, this might throw an error we need to catch but that's fine for Alpha
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    // 2. Execute the Transfer of the exact expected base fare to the Driver's Connect bank
    const transferAmountCents = Math.round(parseFloat(driverFareExpected) * 100);

    const transfer = await stripe.transfers.create({
      amount: transferAmountCents,
      currency: 'usd',
      destination: driverStripeAccountId,
      transfer_group: paymentIntentId, // Groups them together in the dashboard
    });

    return res.status(200).json({ success: true, transferId: transfer.id });

  } catch (err) {
    console.error('Stripe Capture Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
