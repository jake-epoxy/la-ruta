import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, email } = req.body;
  
  if (!uid) {
    return res.status(400).json({ error: 'Missing user UID' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // 1. Create a new Express Connect Account
    const account = await stripe.accounts.create({
      type: 'express',
      email: email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });

    // 2. Create the Onboarding Link for that account
    // We point the return URL back to the driver dashboard
    const origin = req.headers.origin || 'https://la-ruta-iota.vercel.app';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/dashboard`,
      return_url: `${origin}/dashboard?stripe_onboarded=true`,
      type: 'account_onboarding',
    });

    // Return the link AND the account ID! The frontend MUST save the account.id to Firebase.
    return res.status(200).json({ 
      url: accountLink.url, 
      stripeAccountId: account.id 
    });

  } catch (error) {
    console.error('Stripe Connect creation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
