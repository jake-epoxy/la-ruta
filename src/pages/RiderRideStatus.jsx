import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRide } from '../context/RideContext';
import { useLocation } from '../context/LocationContext';
import { motion } from 'framer-motion';
import Map from '../components/Map';
import EmergencySOS from '../components/EmergencySOS';
import { Navigation, Phone, MessageSquare, MapPin, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './Dashboard.css';
import './Rider.css';

export default function RiderRideStatus() {
  const navigate = useNavigate();
  const { activeRide, cancelRide, rideHistory, submitTip } = useRide();
  const { position, startTracking } = useLocation();
  const [driverLocation, setDriverLocation] = useState(null);
  const [focusCoords, setFocusCoords] = useState(null);
  const [isTipping, setIsTipping] = useState(false);
  const [customTip, setCustomTip] = useState('');

  useEffect(() => { startTracking(); }, []);

  // Listen to driver's live location
  useEffect(() => {
    if (!activeRide?.driverId) return;
    const unsub = onSnapshot(doc(db, 'users', activeRide.driverId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.location) setDriverLocation(data.location);
      }
    });
    return () => unsub();
  }, [activeRide?.driverId]);

  // Redirect if no active ride
  useEffect(() => {
    if (!activeRide) {
      const t = setTimeout(() => navigate('/rider'), 3000);
      return () => clearTimeout(t);
    }
  }, [activeRide, navigate]);

  const statusConfig = {
    requested: { text: 'Finding your driver...', sub: 'Matching you with a nearby driver', color: 'var(--gold-primary)', emoji: '🔍', step: 1 },
    accepted: { text: 'Driver is on the way!', sub: 'Your driver accepted and is headed to you', color: 'var(--green-primary)', emoji: '🚗', step: 2 },
    arriving: { text: 'Driver is arriving!', sub: 'Your driver is almost at the pickup point', color: 'var(--green-primary)', emoji: '📍', step: 3 },
    inprogress: { text: 'Ride in progress', sub: 'Sit back and enjoy the ride', color: 'var(--green-primary)', emoji: '🛣️', step: 4 },
  };

  const status = activeRide ? statusConfig[activeRide.status] : null;

  const driverMarkers = driverLocation ? [{
    uid: activeRide?.driverId || 'driver',
    name: activeRide?.driverName || 'Driver',
    location: driverLocation,
    rating: 4.9,
  }] : [];

  const triggerCameraPan = (coords) => {
    if (!coords) return;
    setFocusCoords([coords.lat, coords.lng]);
    setTimeout(() => setFocusCoords(null), 4000); // Resume tracking after 4 seconds
  };

  const newestPastRide = rideHistory && rideHistory.length > 0 ? rideHistory[0] : null;

  if (!activeRide) {
    const isCancelled = newestPastRide?.status?.includes('cancel');
    const isCompleted = newestPastRide?.status === 'completed';

    const handleTip = async (amount) => {
      if (!newestPastRide || isTipping || amount <= 0) return;
      setIsTipping(true);
      try {
        await submitTip(newestPastRide.id, amount);
        navigate('/rider');
      } catch (err) {
        setIsTipping(false);
        alert("Failed to submit tip. Please check connection.");
      }
    };

    if (isCompleted) {
      return (
        <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div 
            className="glass-card" 
            initial={{ opacity: 0, scale: 0.8, y: 50 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            style={{ textAlign: 'center', width: '100%', borderColor: 'var(--gold-primary)', boxShadow: '0 8px 32px rgba(255, 215, 64, 0.15)' }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-primary)', fontSize: '2rem', marginBottom: '8px' }}>
              You've Arrived!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1.1rem' }}>
              Tip <strong>{newestPastRide.driverName || 'your driver'}</strong> to say thanks!
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
               {[2, 3, 5, 10].map(amount => (
                 <motion.button
                   key={amount}
                   whileTap={{ scale: 0.9 }}
                   className="btn"
                   onClick={() => handleTip(amount)}
                   disabled={isTipping}
                   style={{ 
                     background: 'rgba(255,215,64,0.1)', 
                     border: '1px solid var(--gold-primary)',
                     color: 'var(--gold-primary)',
                     fontSize: '1.5rem',
                     fontWeight: 700,
                     padding: '16px'
                   }}
                 >
                   ${amount}
                 </motion.button>
               ))}
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
               <input 
                 type="number" 
                 placeholder="Custom amount" 
                 className="input-field" 
                 value={customTip} 
                 onChange={e => setCustomTip(e.target.value)} 
                 style={{ flex: 1 }} 
               />
               <button 
                 className="btn btn-primary" 
                 onClick={() => handleTip(parseFloat(customTip) || 0)}
                 disabled={!customTip || isTipping}
               >
                 {isTipping ? '...' : 'Send'}
               </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--green-primary)', fontWeight: 600, marginBottom: '24px' }}>
              100% of your tip goes instantly to {newestPastRide.driverName || 'the driver'}.
            </p>

            <Link to="/rider" className="btn btn-secondary" style={{ width: '100%', border: 'none', background: 'transparent' }}>
              No thanks, return home
            </Link>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="dashboard-page">
        <motion.div 
          className="glass-card ride-complete-card" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          style={{ borderColor: isCancelled ? 'var(--red-primary)' : 'var(--green-primary)' }}
        >
          <div className="ride-complete-icon">{isCancelled ? '❌' : '✅'}</div>
          <h2 style={{ color: isCancelled ? 'var(--red-primary)' : 'inherit' }}>
            {isCancelled ? 'Ride Cancelled' : 'Ride Complete!'}
          </h2>
          <p className="text-secondary">
            {isCancelled ? 'This ride was cancelled.' : 'Thanks for riding with La Ruta'}
          </p>
          <Link to="/rider" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)', background: isCancelled ? 'var(--red-primary)' : 'var(--green-primary)' }}>
            {isCancelled ? 'Return Home' : 'Request Another Ride'} <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="ride-status-page">
      {/* Emergency SOS */}
      <EmergencySOS />
      {/* Full-width map */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ride-status-map">
        <Map
          userPosition={position}
          drivers={driverMarkers}
          pickupCoords={activeRide.pickupCoords ? [activeRide.pickupCoords.lat, activeRide.pickupCoords.lng] : null}
          dropoffCoords={activeRide.dropoffCoords ? [activeRide.dropoffCoords.lat, activeRide.dropoffCoords.lng] : null}
          showRoute={true}
          followDriver={!!driverLocation}
          focusCoords={focusCoords}
          tall={true}
        />
        {activeRide.status !== 'requested' && !driverLocation && (
          <div style={{
            textAlign: 'center', padding: '8px', fontSize: '0.8rem',
            color: 'var(--gold-primary)', background: 'rgba(255,215,64,0.08)',
            borderRadius: '0 0 var(--radius-md) var(--radius-md)',
            borderTop: '1px solid rgba(255,215,64,0.2)',
          }}>
            ⏳ Locating your driver... (waiting for GPS signal)
          </div>
        )}
        {driverLocation && (
          <div style={{
            textAlign: 'center', padding: '8px', fontSize: '0.8rem',
            color: 'var(--green-primary)', background: 'rgba(0,230,118,0.06)',
            borderRadius: '0 0 var(--radius-md) var(--radius-md)',
            borderTop: '1px solid rgba(0,230,118,0.15)',
          }}>
            🟢 Tracking driver live{driverLocation.accuracy ? ` (${Math.round(driverLocation.accuracy)}m accuracy)` : ''}
          </div>
        )}
      </motion.div>

      {/* Status panel — slides up from bottom */}
      <motion.div
        layout
        className="ride-status-panel"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.7, delay: 0.1 }}
      >
        {/* Progress bar */}
        <div className="ride-progress">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`progress-step ${status.step >= step ? 'active' : ''}`} />
          ))}
        </div>

        {/* Status text */}
        <div className="ride-status-header">
          <span className="ride-status-emoji">{status.emoji}</span>
          <div>
            <h2 className="ride-status-title" style={{ color: status.color }}>{status.text}</h2>
            <p className="ride-status-sub">{status.sub}</p>
          </div>
        </div>

        {/* Driver info */}
        {activeRide.driverName && (
          <motion.div layout className="driver-card-v2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="driver-card-left">
              <div className="driver-avatar-v2">
                {activeRide.driverName.charAt(0)}
              </div>
              <div className="driver-info-v2">
                <h3>{activeRide.driverName}</h3>
                <div className="driver-rating-v2">
                  <span>⭐ 4.9</span>
                  <span className="driver-badge">{activeRide.tier || 'La Ruta Standard'}</span>
                </div>
              </div>
            </div>
            <div className="driver-contact-v2">
              {activeRide.driverPhone ? (
                <>
                  <motion.a whileTap={{ scale: 0.85 }} href={`tel:${activeRide.driverPhone}`} className="contact-btn call">
                    <Phone size={18} />
                  </motion.a>
                  <motion.a whileTap={{ scale: 0.85 }} href={`sms:${activeRide.driverPhone}`} className="contact-btn text">
                    <MessageSquare size={18} />
                  </motion.a>
                </>
              ) : (
                <span className="no-phone">No phone</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Route details */}
        <div className="ride-route-v2">
          <motion.div 
            className="route-stop" 
            whileTap={{ scale: 0.98 }} 
            onClick={() => triggerCameraPan(activeRide.pickupCoords)}
            style={{ cursor: 'pointer' }}
          >
            <div className="route-dot green" />
            <div className="route-info">
              <span className="route-label">PICKUP</span>
              <span className="route-address">{activeRide.pickup}</span>
            </div>
          </motion.div>
          <div className="route-connector" />
          <motion.div 
            className="route-stop" 
            whileTap={{ scale: 0.98 }} 
            onClick={() => triggerCameraPan(activeRide.dropoffCoords)}
            style={{ cursor: 'pointer' }}
          >
            <div className="route-dot gold" />
            <div className="route-info">
              <span className="route-label">DROP-OFF</span>
              <span className="route-address">{activeRide.dropoff}</span>
            </div>
          </motion.div>
        </div>

        {/* Fare */}
        <div className="ride-fare-v2">
          <div>
            <span className="fare-label">Estimated Fare</span>
            <span className="fare-badge">100% to driver</span>
          </div>
          <span className="fare-amount">${(activeRide.fare || 0).toFixed(2)}</span>
        </div>

        {/* Cancel */}
        {['requested', 'accepted'].includes(activeRide.status) && (
          <motion.button
            layout
            whileTap={{ scale: 0.95 }}
            className="btn btn-secondary"
            onClick={() => {
              if (window.confirm("Are you sure you want to cancel this ride?")) {
                cancelRide(activeRide.id, 'rider');
              }
            }}
            style={{ width: '100%', marginTop: 'var(--space-sm)', color: '#ff5252', borderColor: 'rgba(255, 82, 82, 0.3)' }}
          >
            Cancel Ride
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
