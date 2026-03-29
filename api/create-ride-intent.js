import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { baseFare } = req.body;
  if (!baseFare) return res.status(400).json({ error: 'Missing base fare' });

  // 1. Algorithmic Fare Calculation to absorb Stripe's 2.9% + 30¢ fee
  const riderTotal = (parseFloat(baseFare) + 0.30) / 0.971;
  const amountInCents = Math.round(riderTotal * 100);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // 2. Create the PaymentIntent. 
    // We set capture_method to 'manual' so we only place a HOLD on the rider's card.
    // The funds are not captured until the driver explicitly completes the ride.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      capture_method: 'manual', 
      metadata: {
        baseFareExpectedByDriver: parseFloat(baseFare).toFixed(2),
      }
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountToDisplay: riderTotal.toFixed(2) // Tell the frontend exactly what to show the Rider
    });
  } catch (err) {
    console.error('Stripe Intent Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
