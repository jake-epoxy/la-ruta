// Vercel Serverless Function — Send SMS to nearby offline drivers
// POST /api/notify-drivers
// Body: { pickup, fare, driverPhones: ["+1234567890", ...] }

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pickup, fare, driverPhones } = req.body;

  if (!driverPhones || driverPhones.length === 0) {
    return res.status(200).json({ sent: 0, message: 'No drivers to notify' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: 'Twilio not configured' });
  }

  const message = `🚗 La Ruta: Ride request near ${pickup || 'your area'}! Fare: $${(fare || 0).toFixed(2)}. Open the app to accept → la-ruta-iota.vercel.app`;

  // Twilio REST API — no SDK needed, just fetch
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  let sent = 0;
  const errors = [];

  // Send to up to 10 drivers max per ride request (avoid spam)
  const phonesToNotify = driverPhones.slice(0, 10);

  for (const phone of phonesToNotify) {
    try {
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: fromNumber,
          Body: message,
        }),
      });

      if (response.ok) {
        sent++;
      } else {
        const err = await response.json();
        errors.push({ phone, error: err.message || 'Send failed' });
      }
    } catch (err) {
      errors.push({ phone, error: err.message });
    }
  }

  return res.status(200).json({ sent, total: phonesToNotify.length, errors });
}
