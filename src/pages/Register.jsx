import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Navigation, ArrowRight, Car, MapPin, Phone } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [driverPreferences, setDriverPreferences] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(name, email, password, role, phone, driverPreferences);
    if (result.success) {
      navigate(role === 'driver' ? '/driver' : '/rider');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
      </div>
      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Navigation size={28} className="text-green" />
          </Link>
          <h1>Join La Ruta</h1>
          <p>Create your account and start earning more</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="role-selector">
            <button
              type="button"
              className={`role-option ${role === 'driver' ? 'active' : ''}`}
              onClick={() => setRole('driver')}
            >
              <Car size={20} />
              <span>I'm a Driver</span>
            </button>
            <button
              type="button"
              className={`role-option ${role === 'rider' ? 'active' : ''}`}
              onClick={() => setRole('rider')}
            >
              <MapPin size={20} />
              <span>I'm a Rider</span>
            </button>
          </div>

          <div className="input-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <div className="input-with-icon">
              <Phone size={16} className="input-icon" />
              <input
                type="tel"
                className="input-field"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {role === 'driver' && (
            <div className="input-group">
              <label>Ride Capabilities (Opt-In)</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', marginTop: '-4px' }}>
                Select capabilities to match with riders requesting specific vibes.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['🤫 Quiet Ride', '🎶 Aux Cord', '❄️ A/C Full Blast', '🗣️ Talkative', '🐾 Pets Allowed', '☕ Coffee Run', '🍫 Snacks Available'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setDriverPreferences(prev => 
                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                      );
                    }}
                    style={{
                      background: driverPreferences.includes(tag) ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.05)',
                      color: driverPreferences.includes(tag) ? 'var(--green-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${driverPreferences.includes(tag) ? 'var(--green-primary)' : 'rgba(255,255,255,0.1)'}`,
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={16} />
          </button>

          {role === 'driver' && (
            <p className="auth-note">
              🚀 Founding driver pricing: <strong className="text-green">$65/mo</strong> or <strong className="text-gold">$500/yr</strong>
            </p>
          )}
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="text-green">Log In</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
