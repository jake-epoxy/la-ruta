import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { paymentIntentId } = req.body;
  
  if (!paymentIntentId) return res.status(400).json({ error: 'Missing paymentIntentId.' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Attempt to cancel the uncaptured hold on the rider's credit card immediately
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    return res.status(200).json({ success: true, status: paymentIntent.status });

  } catch (err) {
    // If it was already canceled, captured, or invalid, log it but don't break the app flow
    console.error('Stripe Cancellation Failed (handled gracefully):', err.message);
    
    // We return 200 so the frontend can proceed to clean up the Firebase database
    return res.status(200).json({ 
      success: false, 
      warning: err.message,
      note: 'The hold may have already been lifted.'
    });
  }
}
