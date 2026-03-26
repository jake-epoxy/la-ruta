import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CreditCard, Check, Calendar, Shield, ArrowRight, Clock } from 'lucide-react';
import './Dashboard.css';
import './Subscription.css';

export default function DriverSubscription() {
  const { user, updateUser } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(user?.subscriptionStatus || 'trialing');

  const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const now = new Date();
  const isTrialActive = trialEndsAt ? trialEndsAt > now : true;
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))) : 30;

  const handleSelectPlan = (plan) => {
    // For now, this just visually sets the intended future plan.
    // In the future this will open Stripe Checkout.
    setCurrentPlan(plan);
    updateUser({ intendedPlan: plan });
    alert(`Stripe Checkout for ${plan} plan will open here when trial is over.`);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Subscription</h1>
          <p>Manage your La Ruta driver access.</p>
        </div>
        {isTrialActive ? (
          <span className="badge badge-green">🚀 Free Trial</span>
        ) : user?.subscriptionStatus === 'active' ? (
          <span className="badge badge-green">👑 Subscribed</span>
        ) : (
          <span style={{ backgroundColor: 'var(--red-primary)' }} className="badge">⚠️ Expired</span>
        )}
      </div>

      {/* Trial Status Box (Primary Focus Now) */}
      <motion.div
        className="current-plan glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ borderColor: isTrialActive ? 'var(--green-primary)' : 'var(--red-primary)' }}
      >
        <div className="current-plan-header">
          {isTrialActive ? <Clock size={22} className="text-green" /> : <Shield size={22} style={{ color: 'var(--red-primary)' }} />}
          <h3>{isTrialActive ? '30-Day Free Trial Active' : 'Trial Expired'}</h3>
        </div>
        <div className="current-plan-details">
          <div className="plan-name">
            <span className="plan-type">{daysLeft} Days Remaining</span>
            <span className="plan-price" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '4px' }}>
               No credit card required yet
            </span>
          </div>
          <div className="plan-benefits">
            <div className="plan-benefit">
              <Check size={16} className="text-green" />
              <span>Keep 100% of all fares instantly</span>
            </div>
            <div className="plan-benefit">
              <Check size={16} className="text-green" />
              <span>Full driver dashboard access</span>
            </div>
            <div className="plan-benefit">
              <Check size={16} className="text-green" />
              <span>Cancel anytime, no obligations</span>
            </div>
          </div>
        </div>
        {isTrialActive && (
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(0, 230, 118, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 230, 118, 0.2)', fontSize: '0.9rem' }}>
            <strong>You're good to go!</strong> Hit "Go Online" from the dashboard to start accepting rides immediately.
          </div>
        )}
      </motion.div>

      {/* Plan Options */}
      <div style={{ marginTop: '30px', marginBottom: '15px' }}>
        <h3>Upcoming Plans (After Trial)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select the plan you want when your 30 days are up.</p>
      </div>
      <div className="plan-options">
        <motion.div
          className={`plan-option glass-card ${currentPlan === 'monthly' ? 'plan-active' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => handleSelectPlan('monthly')}
        >
          <div className="plan-option-header">
            <Calendar size={20} />
            <h3>Monthly Plan</h3>
          </div>
          <div className="plan-option-price">
            <span className="price-amount">$65</span>
            <span className="price-period">/month</span>
          </div>
          <p className="plan-option-desc">Pay monthly, cancel anytime. Perfect for flexibility.</p>
          <button className={`btn ${currentPlan === 'monthly' ? 'btn-primary' : 'btn-outline'}`}>
            {currentPlan === 'monthly' ? 'Selected' : 'Select Monthly'}
          </button>
        </motion.div>

        <motion.div
          className={`plan-option glass-card ${currentPlan === 'annual' ? 'plan-active' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => handleSelectPlan('annual')}
        >
          <span className="badge badge-gold plan-option-badge">🔥 Best Value</span>
          <div className="plan-option-header">
            <CreditCard size={20} />
            <h3>Annual Plan</h3>
          </div>
          <div className="plan-option-price">
            <span className="price-amount">$500</span>
            <span className="price-period">/year</span>
          </div>
          <p className="plan-option-desc">Save $280/year. Locked in founding member rate forever.</p>
          <div className="plan-option-savings badge badge-green">Save 36%</div>
          <button className={`btn ${currentPlan === 'annual' ? 'btn-gold' : 'btn-outline'}`}>
            {currentPlan === 'annual' ? 'Selected' : 'Select Annual'} <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
