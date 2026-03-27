import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { useLocation } from '../context/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';
import Map from '../components/Map';
import EmergencySOS from '../components/EmergencySOS';
import {
  DollarSign, TrendingUp, Car, Star, Power, MapPin, Clock, Navigation,
  Check, X as XIcon, User, Phone, MessageSquare
} from 'lucide-react';
import './Dashboard.css';

export default function DriverDashboard() {
  const { user, updateUser } = useAuth();
  const { activeRide, availableRides, rideHistory, acceptRide, cancelRide, updateRideStatus } = useRide();
  const { position, startTracking, stopTracking, isTracking, locationError, setManualPosition } = useLocation();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [manualAddress, setManualAddress] = useState('');
  const [settingManual, setSettingManual] = useState(false);

  // Auto-start GPS if driver was already online (e.g. page refresh)
  useEffect(() => {
    if (isOnline && !isTracking) {
      startTracking();
    }
  }, [isOnline]);

  const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const now = new Date();
  const isTrialActive = trialEndsAt ? trialEndsAt > now : true; // assume active if no date set yet
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))) : 30;

  const todayEarnings = rideHistory
    .filter(r => r.status === 'completed')
    .reduce((s, r) => s + (r.fare || 0) + (parseFloat(r.tip) || 0), 0);

  const todayRides = rideHistory.filter(r => r.status === 'completed').length;

  const toggleOnline = async () => {
    if (!isOnline && !isTrialActive && user?.subscriptionStatus !== 'active') {
      alert('Your free trial has expired! Please subscribe to continue driving.');
      return;
    }
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await updateUser({ isOnline: newStatus });
    if (newStatus) {
      startTracking();
    } else {
      stopTracking();
      await updateUser({ location: null });
    }
  };

  const handleManualLocation = async () => {
    if (!manualAddress.trim()) return;
    setSettingManual(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}&limit=1&countrycodes=us`
      );
      const data = await res.json();
      if (data.length > 0) {
        setManualPosition(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        alert('Address not found. Try a more specific address.');
      }
    } catch (e) {
      alert('Failed to look up address. Check your connection.');
    }
    setSettingManual(false);
  };

  const handleAcceptRide = async (rideId) => {
    await acceptRide(rideId);
  };

  const handleUpdateStatus = async (status) => {
    if (activeRide) {
      await updateRideStatus(activeRide.id, status);
    }
  };

  const handleCancelRide = async () => {
    if (activeRide && window.confirm("Are you sure you want to cancel picking up this rider? This will clear the ride from your screen.")) {
      try {
        alert("Attempting to cancel ride ID: " + activeRide.id);
        await cancelRide(activeRide.id, 'driver');
        alert("Ride payload successfully cancelled. You are back online.");
      } catch (err) {
        alert("System Error: Failed to drop ride payload. Please verify your connection.");
        console.error(err);
      }
    }
  };

  const driverPrefs = user?.driverPreferences || [];
  const compatibleRides = availableRides.filter(ride => {
    if (!ride.vibes || ride.vibes.length === 0) return true;
    return ride.vibes.every(vibe => driverPrefs.includes(vibe));
  });

  return (
    <div className="dashboard-page">
      {/* Emergency SOS — visible during active rides */}
      {activeRide && <EmergencySOS />}
      <div className="dashboard-header">
        <div>
          <h1>Driver Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
          {user?.subscriptionStatus === 'trialing' && isTrialActive && (
            <div style={{ marginTop: '8px', display: 'inline-block' }} className="badge badge-green">
              🚀 Free Trial Active ({daysLeft} days left)
            </div>
          )}
          {!isTrialActive && user?.subscriptionStatus !== 'active' && (
            <div style={{ marginTop: '8px', display: 'inline-block', backgroundColor: 'var(--red-primary)' }} className="badge">
              ⚠️ Trial Expired
            </div>
          )}
        </div>
        <button
          className={`online-toggle ${isOnline ? 'online' : ''}`}
          onClick={toggleOnline}
        >
          <Power size={18} />
          <span>{isOnline ? 'Online' : 'Go Online'}</span>
          <div className={`toggle-dot ${isOnline ? 'active' : ''}`} />
        </button>
      </div>

      {isOnline && (
        <motion.div
          className="online-banner glass-card"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="online-pulse" />
          <div style={{ flex: 1 }}>
            <span>You're online and accepting ride requests</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.8rem' }}>
              {position ? (
                <span style={{ color: 'var(--green-primary)', fontWeight: 600 }}>
                  ✅ GPS Active — sharing your location ({Math.round(position.accuracy || 0)}m accuracy)
                </span>
              ) : isTracking ? (
                <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>
                  ⏳ Acquiring GPS signal...
                </span>
              ) : (
                <span style={{ color: 'var(--red-primary)', fontWeight: 600 }}>
                  ❌ GPS not started
                </span>
              )}
            </div>
            {locationError && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ color: 'var(--red-primary)', fontSize: '0.8rem', marginBottom: '8px' }}>
                  ⚠️ {locationError}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Enter your current address to share your location manually:
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="123 Main St, El Paso, TX"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    style={{ flex: 1, fontSize: '0.85rem', padding: '8px 12px' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualLocation()}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleManualLocation}
                    disabled={settingManual || !manualAddress.trim()}
                  >
                    {settingManual ? '...' : '📍 Set'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Map */}
      {isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 'var(--space-xl)' }}
        >
          <Map
            userPosition={position}
            drivers={[]}
            pickupCoords={activeRide?.pickupCoords ? [activeRide.pickupCoords.lat, activeRide.pickupCoords.lng] : null}
            dropoffCoords={activeRide?.dropoffCoords ? [activeRide.dropoffCoords.lat, activeRide.dropoffCoords.lng] : null}
            showRoute={!!activeRide}
          />
        </motion.div>
      )}

      {/* Active Ride */}
      <AnimatePresence>
        {activeRide && (
          <motion.div
            className="glass-card active-ride-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ marginBottom: 'var(--space-xl)', borderColor: 'var(--green-primary)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>🚗 Active Ride <span style={{fontSize: '0.8rem', color: 'var(--gold-primary)', marginLeft: '8px'}}>{activeRide.tier || 'Standard'}</span></h3>
              <span className="badge badge-green">{activeRide.status.toUpperCase()}</span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div className="ride-points">
                <div className="ride-point ride-point-start" />
                <div className="ride-line" />
                <div className="ride-point ride-point-end" />
              </div>
              <div className="ride-addresses">
                <span className="ride-from">{activeRide.pickup}</span>
                <span className="ride-to">{activeRide.dropoff}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <span><User size={14} /> {activeRide.riderName}</span>
              <span className="text-green" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>
                ${(activeRide.fare || 0).toFixed(2)}
              </span>
            </div>

            {activeRide.riderPhone && (
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <a href={`tel:${activeRide.riderPhone}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  <Phone size={14} /> Call Rider
                </a>
                <a href={`sms:${activeRide.riderPhone}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  <MessageSquare size={14} /> Text Rider
                </a>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {activeRide.status === 'accepted' && (
                <button className="btn btn-primary" onClick={() => handleUpdateStatus('arriving')} style={{ flex: 1 }}>
                  I'm Arriving
                </button>
              )}
              {activeRide.status === 'arriving' && (
                <button className="btn btn-primary" onClick={() => handleUpdateStatus('inprogress')} style={{ flex: 1 }}>
                  Start Ride
                </button>
              )}
              {activeRide.status === 'inprogress' && (
                <button className="btn btn-gold" onClick={() => handleUpdateStatus('completed')} style={{ flex: 1 }}>
                  Complete Ride — ${(activeRide.fare || 0).toFixed(2)}
                </button>
              )}
              {['accepted', 'arriving'].includes(activeRide.status) && (
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCancelRide}
                  style={{ color: '#ff5252', borderColor: 'rgba(255, 82, 82, 0.3)' }}
                >
                  Cancel Pick-up
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming Ride Requests */}
      {isOnline && !activeRide && compatibleRides.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 'var(--space-xl)' }}
        >
          <h3 style={{ marginBottom: 'var(--space-md)' }}>📥 Incoming Ride Requests</h3>
          {compatibleRides.map(ride => (
            <div key={ride.id} className="glass-card" style={{ marginBottom: 'var(--space-sm)', borderColor: 'var(--gold-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <div>
                  <span style={{ display: 'block' }}><User size={14} /> {ride.riderName}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 600 }}>{ride.tier || 'Standard'}</span>
                </div>
                <span className="text-green" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>
                  ${(ride.fare || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <div className="ride-points">
                  <div className="ride-point ride-point-start" />
                  <div className="ride-line" />
                  <div className="ride-point ride-point-end" />
                </div>
                <div className="ride-addresses">
                  <span className="ride-from">{ride.pickup}</span>
                  <span className="ride-to">{ride.dropoff}</span>
                </div>
              </div>
              
              {ride.vibes && ride.vibes.length > 0 && (
                <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ride.vibes.map(vibe => (
                    <span key={vibe} style={{ 
                      fontSize: '0.75rem', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      background: 'rgba(0, 230, 118, 0.1)', 
                      color: 'var(--green-primary)',
                      border: '1px solid rgba(0, 230, 118, 0.2)'
                    }}>
                      {vibe}
                    </span>
                  ))}
                </div>
              )}

              <button className="btn btn-primary" onClick={() => handleAcceptRide(ride.id)} style={{ width: '100%' }}>
                <Check size={16} /> Accept Ride
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {isOnline && !activeRide && compatibleRides.length === 0 && (
        <motion.div
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: 'var(--space-3xl)', marginBottom: 'var(--space-xl)' }}
        >
          <Navigation size={36} className="text-green" style={{ marginBottom: 'var(--space-md)' }} />
          <h3>Waiting for ride requests...</h3>
          <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
            You'll see requests here when a rider nearby needs a ride.
          </p>
        </motion.div>
      )}

      {/* Stats */}
      <div className="dashboard-grid">
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon" style={{ background: 'var(--green-subtle)', color: 'var(--green-primary)' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-value text-green">${todayEarnings.toFixed(2)}</div>
          <div className="stat-label">Total Earnings</div>
          <div className="stat-comparison"><span className="badge badge-green">100% kept</span></div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}>
            <Car size={22} />
          </div>
          <div className="stat-value">{todayRides}</div>
          <div className="stat-label">Rides Completed</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-icon" style={{ background: 'rgba(255, 215, 64, 0.15)', color: 'var(--gold-primary)' }}>
            <Star size={22} />
          </div>
          <div className="stat-value text-gold">{user?.rating || '4.9'}</div>
          <div className="stat-label">Driver Rating</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-value">$0.00</div>
          <div className="stat-label">Fees Paid</div>
          <div className="stat-comparison"><span className="badge badge-green">$0 commission</span></div>
        </motion.div>
      </div>

      {/* Recent completed rides */}
      {rideHistory.filter(r => r.status === 'completed').length > 0 && (
        <motion.div className="recent-rides glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3>Recent Rides</h3>
          <div className="rides-list">
            {rideHistory.filter(r => r.status === 'completed').slice(0, 5).map(ride => (
              <div key={ride.id} className="ride-item">
                <div className="ride-route">
                  <div className="ride-points">
                    <div className="ride-point ride-point-start" />
                    <div className="ride-line" />
                    <div className="ride-point ride-point-end" />
                  </div>
                  <div className="ride-addresses">
                    <span className="ride-from">{ride.pickup}</span>
                    <span className="ride-to">{ride.dropoff}</span>
                  </div>
                </div>
                <div className="ride-details">
                  <span className="ride-rider">{ride.riderName}</span>
                </div>
                <div className="ride-fare">
                  <span className="ride-fare-amount">${(ride.fare || 0).toFixed(2)}</span>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>100% kept</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
