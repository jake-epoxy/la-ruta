import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Check, X, MapPin, User, ChevronRight } from 'lucide-react';
import './Dashboard.css';
import './Schedule.css';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_BLOCKS = [
  { id: 'morning', label: '🌅 Morning', start: '06:00', end: '12:00' },
  { id: 'afternoon', label: '☀️ Afternoon', start: '12:00', end: '18:00' },
  { id: 'evening', label: '🌙 Evening', start: '18:00', end: '00:00' },
];

export default function DriverSchedule() {
  const { user, updateUser } = useAuth();
  const { scheduledRides, acceptScheduledRide, declineScheduledRide } = useRide();
  const [schedule, setSchedule] = useState(user?.schedule || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.schedule) setSchedule(user.schedule);
  }, [user?.schedule]);

  const isSlotActive = (day, blockId) => {
    return schedule.some(s => s.day === day && s.block === blockId);
  };

  const toggleSlot = (day, block) => {
    setSchedule(prev => {
      const exists = prev.some(s => s.day === day && s.block === block.id);
      if (exists) {
        return prev.filter(s => !(s.day === day && s.block === block.id));
      } else {
        return [...prev, { day, block: block.id, start: block.start, end: block.end }];
      }
    });
    setSaved(false);
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      await updateUser({ schedule });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Failed to save schedule. Check your connection.');
    }
    setSaving(false);
  };

  // Filter scheduled rides for this driver
  const pendingRequests = scheduledRides.filter(r => 
    r.requestedDriverId === user?.uid && r.status === 'pending'
  );
  const upcomingRides = scheduledRides.filter(r => 
    r.driverId === user?.uid && r.status === 'accepted'
  );

  const formatScheduledTime = (timeStr) => {
    if (!timeStr) return 'TBD';
    const d = new Date(timeStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + 
           ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>My Schedule</h1>
          <p>Set your weekly availability and manage upcoming rides.</p>
        </div>
      </div>

      {/* Weekly Availability Grid */}
      <motion.div 
        className="glass-card schedule-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="schedule-card-header">
          <h3><Calendar size={18} /> Weekly Availability</h3>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Tap time blocks to set when you're available to drive
          </p>
        </div>

        <div className="schedule-grid">
          {/* Header row */}
          <div className="schedule-grid-header">
            <div className="schedule-grid-corner" />
            {DAY_LABELS.map((label, i) => (
              <div key={DAYS[i]} className="schedule-day-label">{label}</div>
            ))}
          </div>

          {/* Time block rows */}
          {TIME_BLOCKS.map(block => (
            <div key={block.id} className="schedule-grid-row">
              <div className="schedule-block-label">{block.label}</div>
              {DAYS.map(day => (
                <motion.button
                  key={`${day}-${block.id}`}
                  whileTap={{ scale: 0.85 }}
                  className={`schedule-cell ${isSlotActive(day, block.id) ? 'active' : ''}`}
                  onClick={() => toggleSlot(day, block)}
                >
                  {isSlotActive(day, block.id) && <Check size={14} />}
                </motion.button>
              ))}
            </div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          className={`btn ${saved ? 'btn-primary' : 'btn-gold'}`}
          onClick={saveSchedule}
          disabled={saving}
          style={{ width: '100%', marginTop: 'var(--space-lg)' }}
        >
          {saving ? 'Saving...' : saved ? '✓ Schedule Saved!' : 'Save Schedule'}
        </motion.button>
      </motion.div>

      {/* Incoming Scheduled Ride Requests */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginTop: 'var(--space-xl)' }}
        >
          <h3 style={{ marginBottom: 'var(--space-md)' }}>📥 Scheduled Ride Requests</h3>
          {pendingRequests.map(ride => (
            <motion.div 
              key={ride.id}
              className="glass-card scheduled-ride-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ borderColor: 'var(--gold-primary)', marginBottom: 'var(--space-md)' }}
            >
              <div className="scheduled-ride-header">
                <div>
                  <span className="badge badge-gold">SCHEDULED REQUEST</span>
                  <p className="scheduled-ride-time">
                    <Clock size={14} /> {formatScheduledTime(ride.scheduledTime)}
                  </p>
                </div>
                <span className="text-green" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>
                  ${(ride.fare || 0).toFixed(2)}
                </span>
              </div>

              <div className="scheduled-ride-rider">
                <User size={14} /> {ride.riderName}
              </div>

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

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary"
                  onClick={() => acceptScheduledRide(ride.id)}
                  style={{ flex: 1 }}
                >
                  <Check size={16} /> Accept
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-secondary"
                  onClick={() => {
                    if (window.confirm('Decline this scheduled ride request?')) {
                      declineScheduledRide(ride.id);
                    }
                  }}
                  style={{ color: '#ff5252', borderColor: 'rgba(255,82,82,0.3)' }}
                >
                  <X size={16} /> Decline
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Upcoming Confirmed Rides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginTop: 'var(--space-xl)' }}
      >
        <h3 style={{ marginBottom: 'var(--space-md)' }}>📅 Upcoming Rides</h3>
        {upcomingRides.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
            <Calendar size={36} className="text-green" style={{ marginBottom: 'var(--space-md)' }} />
            <h3>No upcoming scheduled rides</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
              When riders schedule rides with you, they'll appear here.
            </p>
          </div>
        ) : (
          upcomingRides.map(ride => (
            <motion.div
              key={ride.id}
              className="glass-card scheduled-ride-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ borderColor: 'var(--green-primary)', marginBottom: 'var(--space-md)' }}
            >
              <div className="scheduled-ride-header">
                <div>
                  <span className="badge badge-green">CONFIRMED</span>
                  <p className="scheduled-ride-time">
                    <Clock size={14} /> {formatScheduledTime(ride.scheduledTime)}
                  </p>
                </div>
                <span className="text-green" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>
                  ${(ride.fare || 0).toFixed(2)}
                </span>
              </div>
              <div className="scheduled-ride-rider">
                <User size={14} /> {ride.riderName}
              </div>
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
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
