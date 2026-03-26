import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Navigation, DollarSign, Shield, Zap, Users, Check, X,
  ChevronDown, ChevronUp, ArrowRight, Star, TrendingUp, Clock
} from 'lucide-react';
import './Landing.css';

function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function Counter({ end, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

const faqs = [
  {
    q: "How does La Ruta make money?",
    a: "We charge a simple flat subscription fee — $65/month or $500/year. That's it. No hidden fees, no commission on rides, no surge pricing cuts. Your ride earnings are 100% yours."
  },
  {
    q: "How do riders pay for rides?",
    a: "Riders pay you directly through the app. We facilitate the connection and handle the payment processing — but we never take a cut of the ride fare."
  },
  {
    q: "What if I don't get enough rides to cover the subscription?",
    a: "Even one or two rides easily covers the monthly fee. The average rideshare driver completes 15-30 rides per week. If you drove for Uber/Lyft, you'd lose far more to their 25-51% commission than our flat $65/month."
  },
  {
    q: "Is the $65/month price permanent?",
    a: "The $65/month rate is our Founding Driver price for the first 30 drivers. This rate is locked in for life for founding members. Future pricing may be different."
  },
  {
    q: "What cities is La Ruta available in?",
    a: "We're launching initially in select cities. Sign up to get on the waitlist for your city and be notified when we expand to your area."
  },
  {
    q: "Do I need a special license to drive?",
    a: "You need to meet the same requirements as any rideshare driver — valid driver's license, vehicle insurance, and a vehicle that passes safety inspection. We'll guide you through the process."
  },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="landing">
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-grid" />
        </div>
        <div className="container hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge badge-green">🚀 First 30 Drivers — Founding Member Pricing</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Keep <span className="gradient-text">Every Dollar</span> You Earn
          </motion.h1>
          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Stop giving up to 51% of your ride earnings to app fees.
            La Ruta charges one flat subscription — you keep 100% of every fare.
          </motion.p>
          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Driving <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              Learn More
            </a>
          </motion.div>
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="hero-stat">
              <span className="hero-stat-value text-green">100%</span>
              <span className="hero-stat-label">Earnings Kept</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value text-gold">$0</span>
              <span className="hero-stat-label">Commission Fees</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value text-green">$65</span>
              <span className="hero-stat-label">Flat Monthly Fee</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <span className="badge badge-red">⚠️ The Problem</span>
              <h2>Drivers Are <span className="text-red">Losing</span> Thousands Every Year</h2>
              <p className="section-sub">
                Ride-share giants take massive cuts from every ride. You do all the work — they take the profit.
              </p>
            </div>
          </AnimatedSection>

          <div className="problem-grid">
            <AnimatedSection className="problem-card glass-card">
              <div className="problem-icon problem-icon-red">
                <DollarSign size={28} />
              </div>
              <h3>Up to <span className="text-red">51%</span> Lost to Fees</h3>
              <p>Uber and Lyft take between 25% to 51% of every ride fare. On a $30 ride, you could lose over $15.</p>
            </AnimatedSection>

            <AnimatedSection className="problem-card glass-card">
              <div className="problem-icon problem-icon-red">
                <TrendingUp size={28} />
              </div>
              <h3>Fees Keep <span className="text-red">Rising</span></h3>
              <p>Platform fees have steadily increased year after year while driver pay has stagnated. The gap is growing.</p>
            </AnimatedSection>

            <AnimatedSection className="problem-card glass-card">
              <div className="problem-icon problem-icon-red">
                <Clock size={28} />
              </div>
              <h3><span className="text-red">Hidden</span> Costs Stack Up</h3>
              <p>Service fees, booking fees, "safety" fees — there are layers of charges that eat into your earnings before you see a dime.</p>
            </AnimatedSection>
          </div>

          <AnimatedSection className="problem-example">
            <div className="glass-card problem-math">
              <h3>Here's What That Looks Like</h3>
              <div className="problem-math-grid">
                <div className="math-item">
                  <span className="math-label">Average ride fare</span>
                  <span className="math-value">$25.00</span>
                </div>
                <div className="math-item math-item-red">
                  <span className="math-label">Platform fees (avg 35%)</span>
                  <span className="math-value text-red">-$8.75</span>
                </div>
                <div className="math-divider" />
                <div className="math-item">
                  <span className="math-label">What you actually keep</span>
                  <span className="math-value">$16.25</span>
                </div>
                <div className="math-item math-item-highlight">
                  <span className="math-label">Lost per year (20 rides/week)</span>
                  <span className="math-value text-red">
                    <Counter end={9100} prefix="-$" />
                  </span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section section-dark">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <span className="badge badge-green">✨ The Solution</span>
              <h2>How <span className="gradient-text">La Ruta</span> Works</h2>
              <p className="section-sub">Three simple steps. Zero commission. Total freedom.</p>
            </div>
          </AnimatedSection>

          <div className="steps-grid">
            <AnimatedSection className="step-card glass-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <CreditCard size={28} />
              </div>
              <h3>Subscribe</h3>
              <p>Choose your plan — $65/month or $500/year. No contracts, cancel anytime. That's the only fee you'll ever pay.</p>
            </AnimatedSection>

            <AnimatedSection className="step-card glass-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <Navigation size={28} />
              </div>
              <h3>Drive</h3>
              <p>Go online, accept ride requests, and drive passengers to their destination. Just like you do now — but better.</p>
            </AnimatedSection>

            <AnimatedSection className="step-card glass-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <DollarSign size={28} />
              </div>
              <h3>Keep 100%</h3>
              <p>Every dollar from every ride goes directly to you. No commission, no service fees, no surprises. Your money, your pocket.</p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <span className="badge badge-gold">💰 Founding Member Pricing</span>
              <h2>Simple, <span className="gradient-text">Transparent</span> Pricing</h2>
              <p className="section-sub">
                No hidden fees. No commission. Just one flat subscription — lock in founding member rates today.
              </p>
            </div>
          </AnimatedSection>

          <div className="pricing-grid">
            <AnimatedSection className="pricing-card glass-card">
              <div className="pricing-header">
                <h3>Monthly</h3>
                <p className="pricing-sub">Perfect for getting started</p>
              </div>
              <div className="pricing-amount">
                <span className="pricing-currency">$</span>
                <span className="pricing-value">65</span>
                <span className="pricing-period">/month</span>
              </div>
              <ul className="pricing-features">
                <li><Check size={16} className="text-green" /> Keep 100% of ride fares</li>
                <li><Check size={16} className="text-green" /> No commission ever</li>
                <li><Check size={16} className="text-green" /> Cancel anytime</li>
                <li><Check size={16} className="text-green" /> Founding member rate locked in</li>
                <li><Check size={16} className="text-green" /> Full driver dashboard</li>
                <li><Check size={16} className="text-green" /> Earnings tracking</li>
              </ul>
              <Link to="/register" className="btn btn-outline" style={{ width: '100%' }}>
                Get Started
              </Link>
              <p className="pricing-spots">
                <span className="text-gold">⚡ Limited:</span> First 30 drivers only
              </p>
            </AnimatedSection>

            <AnimatedSection className="pricing-card pricing-card-featured glass-card">
              <div className="pricing-popular">
                <span className="badge badge-gold">🔥 Best Value</span>
              </div>
              <div className="pricing-header">
                <h3>Annual</h3>
                <p className="pricing-sub">Save $280 per year</p>
              </div>
              <div className="pricing-amount">
                <span className="pricing-currency">$</span>
                <span className="pricing-value">500</span>
                <span className="pricing-period">/year</span>
              </div>
              <div className="pricing-savings">
                <span className="badge badge-green">Save 36% vs monthly</span>
              </div>
              <ul className="pricing-features">
                <li><Check size={16} className="text-green" /> Everything in Monthly</li>
                <li><Check size={16} className="text-green" /> Save $280 annually</li>
                <li><Check size={16} className="text-green" /> Priority support</li>
                <li><Check size={16} className="text-green" /> Founding member rate — forever</li>
                <li><Check size={16} className="text-green" /> Early access to new features</li>
                <li><Check size={16} className="text-green" /> Referral bonuses</li>
              </ul>
              <Link to="/register" className="btn btn-gold" style={{ width: '100%' }}>
                Get Annual Plan <ArrowRight size={16} />
              </Link>
              <p className="pricing-spots">
                <span className="text-gold">⚡ Limited:</span> First 30 drivers only
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section id="comparison" className="section section-dark">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <span className="badge badge-green">📊 Comparison</span>
              <h2>La Ruta vs <span className="text-muted">The Competition</span></h2>
              <p className="section-sub">See how much more you keep with La Ruta</p>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="comparison-table-wrapper glass-card">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th className="comp-laruta">La Ruta</th>
                    <th className="comp-other">Uber / Lyft</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Driver Commission</td>
                    <td className="comp-laruta"><span className="text-green">0%</span></td>
                    <td className="comp-other"><span className="text-red">25-51%</span></td>
                  </tr>
                  <tr>
                    <td>Monthly Cost</td>
                    <td className="comp-laruta"><span className="text-green">$65 flat</span></td>
                    <td className="comp-other"><span className="text-red">Varies (deducted per ride)</span></td>
                  </tr>
                  <tr>
                    <td>$25 Ride — You Keep</td>
                    <td className="comp-laruta"><span className="text-green">$25.00</span></td>
                    <td className="comp-other"><span className="text-red">$12.25 - $18.75</span></td>
                  </tr>
                  <tr>
                    <td>Annual Earnings (20 rides/wk)</td>
                    <td className="comp-laruta"><span className="text-green">$25,220</span></td>
                    <td className="comp-other"><span className="text-red">$12,740 - $19,500</span></td>
                  </tr>
                  <tr>
                    <td>Surge Pricing Cuts</td>
                    <td className="comp-laruta"><Check size={16} className="text-green" /> You keep 100%</td>
                    <td className="comp-other"><X size={16} className="text-red" /> Platform takes more</td>
                  </tr>
                  <tr>
                    <td>Transparent Pricing</td>
                    <td className="comp-laruta"><Check size={16} className="text-green" /> Always</td>
                    <td className="comp-other"><X size={16} className="text-red" /> Hidden fees</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <span className="badge badge-green">❓ FAQ</span>
              <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
            </div>
          </AnimatedSection>

          <div className="faq-list">
            {faqs.map((faq, i) => (
              <AnimatedSection key={i}>
                <div
                  className={`faq-item glass-card ${openFaq === i ? 'open' : ''}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="faq-question">
                    <h3>{faq.q}</h3>
                    {openFaq === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  {openFaq === i && (
                    <motion.div
                      className="faq-answer"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      <p>{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <AnimatedSection className="cta-content">
            <h2>Ready to Keep <span className="gradient-text">Every Dollar</span>?</h2>
            <p>Join the first 30 founding drivers and lock in your rate forever.</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Become a Founding Driver <ArrowRight size={18} />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <div className="navbar-brand">
              <Navigation size={20} className="text-green" />
              <span>La Ruta</span>
            </div>
            <p>The driver-first ride platform. Keep 100% of your earnings.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#how-it-works">How It Works</a>
              <a href="#pricing">Pricing</a>
              <a href="#comparison">Compare</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} La Ruta. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CreditCard({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
