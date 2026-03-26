import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, LogOut, Home, BarChart3, CreditCard,
  MapPin, Clock, User, Navigation
} from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname.startsWith('/driver') || location.pathname.startsWith('/rider');

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav className={`navbar ${isDashboard ? 'navbar-dashboard' : ''} ${isLanding ? 'navbar-landing' : ''}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Navigation className="brand-icon" size={24} />
          <span className="brand-text">La Ruta</span>
        </Link>

        {isLanding && (
          <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
            <a href="#problem" onClick={() => setMobileOpen(false)}>The Problem</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How It Works</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a>
            <div className="navbar-auth-mobile">
              {user ? (
                <Link
                  to={user.role === 'driver' ? '/driver' : '/rider'}
                  className="btn btn-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}>
                    Log In
                  </Link>
                  <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user">
              {!isDashboard && (
                <Link
                  to={user.role === 'driver' ? '/driver' : '/rider'}
                  className="btn btn-primary btn-sm"
                >
                  Dashboard
                </Link>
              )}
              {isDashboard && (
                <div className="user-info">
                  <User size={16} />
                  <span>{user.name}</span>
                </div>
              )}
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={16} />
                <span className="logout-text">Log Out</span>
              </button>
            </div>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}

          {isLanding && (
            <button
              className="navbar-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
