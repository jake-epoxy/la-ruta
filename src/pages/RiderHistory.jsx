import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { Clock, MapPin, DollarSign, Star, Heart } from 'lucide-react';
import './Dashboard.css';
import './Rider.css';

export default function RiderHistory() {
  const { user, updateUser } = useAuth();
  const { rideHistory } = useRide();

  const completedRides = rideHistory.filter(r => r.status === 'completed');
  const totalSpent = completedRides.reduce((s, r) => s + (r.fare || 0), 0);

  const favoriteDrivers = user?.favoriteDrivers || [];

  const toggleFavorite = async (driverId) => {
    if (!driverId) return;
    const isFav = favoriteDrivers.includes(driverId);
    let newFavs;
    if (isFav) {
      newFavs = favoriteDrivers.filter(id => id !== driverId);
    } else {
      newFavs = [...favoriteDrivers, driverId];
    }
    await updateUser({ favoriteDrivers: newFavs });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Ride History</h1>
          <p>View your past rides and receipts.</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}>
            <Clock size={22} />
          </div>
          <div className="stat-value">{completedRides.length}</div>
          <div className="stat-label">Total Rides</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon" style={{ background: 'var(--green-subtle)', color: 'var(--green-primary)' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-value text-green">${totalSpent.toFixed(2)}</div>
          <div className="stat-label">Total Spent</div>
        </motion.div>
      </div>

      {completedRides.length === 0 ? (
        <motion.div
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}
        >
          <h3>No rides yet</h3>
          <p className="text-secondary" style={{ marginTop: 'var(--space-sm)', fontSize: '0.9rem' }}>
            Your completed rides will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="history-list">
          {completedRides.map((ride, i) => (
            <motion.div
              key={ride.id}
              className="history-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <div className="history-header">
                <span className="history-date">
                  {ride.completedAt?.toDate ? ride.completedAt.toDate().toLocaleDateString() : 'Recent'}
                </span>
                <span className="history-fare text-green">${(ride.fare || 0).toFixed(2)}</span>
              </div>

              <div className="history-route">
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

              <div className="history-footer">
                <div className="history-driver">
                  <span className="history-driver-name">{ride.driverName || 'Driver'}</span>
                  <span className="history-rating">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={12} fill="var(--gold-primary)" color="var(--gold-primary)" />
                    ))}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {ride.driverId && (
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleFavorite(ride.driverId)}
                      className="btn btn-sm"
                      style={{
                        background: favoriteDrivers.includes(ride.driverId) ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)',
                        color: favoriteDrivers.includes(ride.driverId) ? '#111' : 'var(--text-secondary)',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '20px'
                      }}
                    >
                      <Heart size={12} fill={favoriteDrivers.includes(ride.driverId) ? '#111' : 'none'} />
                      {favoriteDrivers.includes(ride.driverId) ? 'Favorited' : 'Favorite'}
                    </motion.button>
                  )}
                  <span className="badge badge-green">Completed</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
