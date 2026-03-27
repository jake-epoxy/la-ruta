import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { useLocation } from '../context/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';
import AddressInput from '../components/AddressInput';
import { Calendar, Clock, MapPin, Heart, Star, ArrowRight, X, User, ChevronDown } from 'lucide-react';
import './Dashboard.css';
import './Schedule.css';

export default function RiderSchedule() {
  const { user } = useAuth();
  const { scheduledRides, createScheduledRide, cancelScheduledRide, fetchDriverDetails } = useRide();
  const { position } = useLocation();

  const [showForm, setShowForm] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [favoriteDriverDetails, setFavoriteDriverDetails] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Load favorite driver details
  useEffect(() => {
    const loadDrivers = async () => {
      const favIds = user?.favoriteDrivers || [];
      if (favIds.length === 0) {
        setFavoriteDriverDetails([]);
        return;
      }
      setLoadingDrivers(true);
      const details = await fetchDriverDetails(favIds);
      setFavoriteDriverDetails(details);
      setLoadingDrivers(false);
    };
    loadDrivers();
  }, [user?.favoriteDrivers, fetchDriverDetails]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimateFare = () => {
    if (!pickupCoords || !dropoffCoords) return 8.00;
    const dist = calculateDistance(
      pickupCoords[0], pickupCoords[1],
      dropoffCoords[0], dropoffCoords[1]
    );
    const baseFee = 2.00;
    const perMile = 1.15;
    const perMinute = 0.20;
    const estimatedMinutes = dist * 2.2;
    return Math.max(baseFee + (perMile * dist) + (perMinute * estimatedMinutes), 5);
  };

  const handleSubmit = async () => {
    if (!pickup || !dropoff || !scheduledDate || !scheduledTime) {
      alert('Please fill in all required fields.');
      return;
    }

    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
    const scheduledTs = new Date(scheduledDateTime).getTime();
    
    if (scheduledTs <= Date.now() + 30 * 60 * 1000) {
      alert('Scheduled time must be at least 30 minutes from now.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedDriverData = favoriteDriverDetails.find(d => d.uid === selectedDriver);
      const pCoords = pickupCoords || (position
        ? [position.lat, position.lng]
        : [31.7619, -106.4850]);
      const dCoords = dropoffCoords || [
        pCoords[0] + (Math.random() * 0.04 - 0.02),
        pCoords[1] + (Math.random() * 0.04 - 0.02),
      ];

      await createScheduledRide({
        pickup,
        dropoff,
        pickupCoords: { lat: pCoords[0], lng: pCoords[1] },
        dropoffCoords: { lat: dCoords[0], lng: dCoords[1] },
        scheduledTime: scheduledDateTime,
        requestedDriverId: selectedDriver || null,
        requestedDriverName: selectedDriverData?.name || null,
        fare: parseFloat(estimateFare().toFixed(2)),
        tier: 'Standard',
      });

      // Reset form
      setPickup('');
      setDropoff('');
      setPickupCoords(null);
      setDropoffCoords(null);
      setScheduledDate('');
      setScheduledTime('');
      setSelectedDriver('');
      setShowForm(false);
    } catch (e) {
      alert('Failed to schedule ride. Please try again.');
      console.error(e);
    }
    setSubmitting(false);
  };

  const formatScheduledTime = (timeStr) => {
    if (!timeStr) return 'TBD';
    const d = new Date(timeStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
           ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const statusConfig = {
    pending: { label: 'Pending', badge: 'badge-gold', icon: '⏳' },
    accepted: { label: 'Confirmed', badge: 'badge-green', icon: '✅' },
    declined: { label: 'Declined', badge: 'badge-red', icon: '❌' },
    cancelled: { label: 'Cancelled', badge: 'badge-red', icon: '🚫' },
  };

  // Get tomorrow's date as minimum for the date picker
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate());
    return d.toISOString().split('T')[0];
  };

  const activeScheduled = scheduledRides.filter(r => !['cancelled', 'completed'].includes(r.status));
  const pastScheduled = scheduledRides.filter(r => ['cancelled', 'completed', 'declined'].includes(r.status));

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Scheduled Rides</h1>
          <p>Book rides in advance with your favorite drivers.</p>
        </div>
      </div>

      {/* Schedule a Ride Button */}
      {!showForm && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn btn-gold btn-lg"
          onClick={() => setShowForm(true)}
          style={{ width: '100%', marginBottom: 'var(--space-xl)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Calendar size={20} /> Schedule a Ride <ArrowRight size={16} />
        </motion.button>
      )}

      {/* Schedule Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass-card schedule-form"
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            style={{ marginBottom: 'var(--space-xl)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h3><Calendar size={18} /> Schedule a Ride</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowForm(false)}>
                <X size={14} /> Close
              </button>
            </div>

            {/* Addresses */}
            <div className="schedule-form-section">
              <AddressInput
                label="Pickup Location"
                placeholder="Search for pickup address..."
                value={pickup}
                onChange={setPickup}
                onSelect={(s) => s ? setPickupCoords([s.lat, s.lng]) : setPickupCoords(null)}
                dotColor="green"
                userPosition={position}
              />
              <div className="ride-input-line" style={{ marginLeft: '5px', height: '16px' }} />
              <AddressInput
                label="Destination"
                placeholder="Search for destination..."
                value={dropoff}
                onChange={setDropoff}
                onSelect={(s) => s ? setDropoffCoords([s.lat, s.lng]) : setDropoffCoords(null)}
                dotColor="gold"
                userPosition={position}
              />
            </div>

            {/* Date & Time */}
            <div className="schedule-form-section schedule-datetime">
              <div className="input-group">
                <label><Calendar size={14} /> Date</label>
                <input
                  type="date"
                  className="input-field"
                  min={getMinDate()}
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label><Clock size={14} /> Time</label>
                <input
                  type="time"
                  className="input-field"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            {/* Favorite Driver Selector */}
            <div className="schedule-form-section">
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Heart size={14} /> Request a Favorite Driver (Optional)
              </label>
              {loadingDrivers ? (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Loading your favorites...</p>
              ) : favoriteDriverDetails.length > 0 ? (
                <div className="favorite-drivers-list">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className={`favorite-driver-option ${selectedDriver === '' ? 'selected' : ''}`}
                    onClick={() => setSelectedDriver('')}
                  >
                    <div className="fav-driver-avatar" style={{ background: 'rgba(255,255,255,0.1)' }}>🌐</div>
                    <div className="fav-driver-info">
                      <span className="fav-driver-name">Any Available Driver</span>
                      <span className="fav-driver-sub">First driver to accept</span>
                    </div>
                    {selectedDriver === '' && <Check size={16} className="text-green" />}
                  </motion.button>
                  {favoriteDriverDetails.map(driver => (
                    <motion.button
                      key={driver.uid}
                      whileTap={{ scale: 0.97 }}
                      className={`favorite-driver-option ${selectedDriver === driver.uid ? 'selected' : ''}`}
                      onClick={() => setSelectedDriver(driver.uid)}
                    >
                      <div className="fav-driver-avatar">{driver.name?.charAt(0)}</div>
                      <div className="fav-driver-info">
                        <span className="fav-driver-name">{driver.name}</span>
                        <span className="fav-driver-sub">⭐ {driver.rating}</span>
                      </div>
                      {selectedDriver === driver.uid && <Check size={16} className="text-green" />}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  No favorite drivers yet. Complete a ride and tap ❤️ to favorite a driver.
                </p>
              )}
            </div>

            {/* Fare Estimate */}
            {pickup && dropoff && (
              <div className="schedule-fare-preview">
                <span>Estimated Fare</span>
                <span className="text-green" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>
                  ${estimateFare().toFixed(2)}
                </span>
              </div>
            )}

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting || !pickup || !dropoff || !scheduledDate || !scheduledTime}
              style={{ width: '100%', marginTop: 'var(--space-md)' }}
            >
              {submitting ? 'Scheduling...' : 'Confirm Scheduled Ride'} <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Scheduled Rides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 style={{ marginBottom: 'var(--space-md)' }}>📅 Upcoming</h3>
        {activeScheduled.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
            <Calendar size={36} className="text-gold" style={{ marginBottom: 'var(--space-md)' }} />
            <h3>No scheduled rides</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
              Tap "Schedule a Ride" to book your first one!
            </p>
          </div>
        ) : (
          activeScheduled.map(ride => {
            const sc = statusConfig[ride.status] || statusConfig.pending;
            return (
              <motion.div
                key={ride.id}
                className="glass-card scheduled-ride-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  borderColor: ride.status === 'accepted' ? 'var(--green-primary)' : 'var(--gold-primary)',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <div className="scheduled-ride-header">
                  <div>
                    <span className={`badge ${sc.badge}`}>{sc.icon} {sc.label}</span>
                    <p className="scheduled-ride-time">
                      <Clock size={14} /> {formatScheduledTime(ride.scheduledTime)}
                    </p>
                  </div>
                  <span className="text-green" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>
                    ${(ride.fare || 0).toFixed(2)}
                  </span>
                </div>

                {ride.requestedDriverName && (
                  <div className="scheduled-ride-rider" style={{ color: 'var(--gold-primary)' }}>
                    <Heart size={14} /> Requested: {ride.requestedDriverName}
                  </div>
                )}

                {ride.driverName && ride.status === 'accepted' && (
                  <div className="scheduled-ride-rider" style={{ color: 'var(--green-primary)' }}>
                    <User size={14} /> Driver: {ride.driverName}
                  </div>
                )}

                <div className="scheduled-ride-route">
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

                {ride.status === 'pending' && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (window.confirm('Cancel this scheduled ride?')) {
                        cancelScheduledRide(ride.id);
                      }
                    }}
                    style={{ width: '100%', marginTop: 'var(--space-sm)', color: '#ff5252', borderColor: 'rgba(255,82,82,0.3)' }}
                  >
                    Cancel Scheduled Ride
                  </motion.button>
                )}
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Past Scheduled Rides */}
      {pastScheduled.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginTop: 'var(--space-xl)' }}
        >
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-muted)' }}>Past Scheduled</h3>
          {pastScheduled.map(ride => {
            const sc = statusConfig[ride.status] || statusConfig.cancelled;
            return (
              <div
                key={ride.id}
                className="glass-card scheduled-ride-card"
                style={{ opacity: 0.6, marginBottom: 'var(--space-sm)' }}
              >
                <div className="scheduled-ride-header">
                  <div>
                    <span className={`badge ${sc.badge}`}>{sc.icon} {sc.label}</span>
                    <p className="scheduled-ride-time" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={14} /> {formatScheduledTime(ride.scheduledTime)}
                    </p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ${(ride.fare || 0).toFixed(2)}
                  </span>
                </div>
                <div className="scheduled-ride-route">
                  <div className="ride-addresses" style={{ paddingLeft: 0 }}>
                    <span className="ride-from">{ride.pickup}</span>
                    <span className="ride-to">{ride.dropoff}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
