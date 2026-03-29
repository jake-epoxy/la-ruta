import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ amountToDisplay, onPaymentSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    // Confirm the setup/payment intent
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/rider/status',
      },
      redirect: 'if_required', // Do not auto-redirect so we can update Firebase first
    });

    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
    } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')) {
      // Payment Authorization Successful!
      await onPaymentSuccess(paymentIntent.id);
    } else {
      setError('Unexpected payment state.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      background: 'var(--surface-color, rgba(25, 25, 25, 0.6))', 
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '28px', 
      borderRadius: '16px',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 600 }}>Confirm Payment</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Secured by Stripe ✨</p>
        </div>
        <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--green-primary)' }}>
          ${amountToDisplay}
        </span>
      </div>
      
      <PaymentElement options={{ layout: 'tabs' }} />
      
      {error && (
        <div style={{ color: 'var(--red-primary)', marginTop: '12px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onCancel}
          disabled={processing}
          style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={!stripe || processing}
          style={{ flex: 2, background: 'var(--green-primary)', color: 'black', fontWeight: 'bold', border: 'none' }}
        >
          {processing ? 'Processing...' : `Hold $${amountToDisplay}`}
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
        Your card is only temporarily authorized. No funds are officially captured until your ride is completed.
      </p>
    </form>
  );
}

export default function RiderCheckout({ baseFare, onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [amountToDisplay, setAmountToDisplay] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initializePayment() {
      try {
        const res = await fetch('/api/create-ride-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseFare })
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setAmountToDisplay(data.amountToDisplay);
          setPaymentIntentId(data.paymentIntentId);
        } else {
          setError(data.error || 'Failed to initialize payment');
        }
      } catch (err) {
        setError('Network error contacting payment server.');
      }
      setLoading(false);
    }
    initializePayment();
  }, [baseFare]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
        <Loader size={32} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--green-primary)' }} />
        <p style={{ marginTop: '12px' }}>Preparing secure checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', background: 'rgba(255,82,82,0.1)', borderRadius: '12px', color: 'var(--red-primary)' }}>
        <p>⚠️ {error}</p>
        <button className="btn btn-secondary btn-sm" onClick={onCancel} style={{ marginTop: '12px' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {clientSecret && (
        <Elements 
          options={{ 
            clientSecret, 
            appearance: { 
              theme: 'night',
              variables: {
                colorPrimary: '#00e676',
                colorBackground: '#1a1a1a',
                colorText: '#ffffff',
                colorDanger: '#ff5252',
                fontFamily: 'Inter, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
              }
            } 
          }} 
          stripe={stripePromise}
        >
          <CheckoutForm 
            amountToDisplay={amountToDisplay} 
            onPaymentSuccess={(pid) => onSuccess(pid || paymentIntentId)} 
            onCancel={onCancel} 
          />
        </Elements>
      )}
    </div>
  );
}
