import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import './Dashboard.css';
import './Earnings.css';

const weeklyData = [
  { day: 'Mon', amount: 145.50 },
  { day: 'Tue', amount: 98.00 },
  { day: 'Wed', amount: 212.75 },
  { day: 'Thu', amount: 176.25 },
  { day: 'Fri', amount: 289.00 },
  { day: 'Sat', amount: 342.50 },
  { day: 'Sun', amount: 195.00 },
];

const rideHistory = [
  { id: 1, date: 'Mar 25', from: 'Downtown', to: 'Airport', fare: 42.50, otherPlatformFee: 14.88 },
  { id: 2, date: 'Mar 25', from: 'University', to: 'Mall', fare: 18.00, otherPlatformFee: 6.30 },
  { id: 3, date: 'Mar 25', from: 'Suburbs', to: 'Downtown', fare: 28.75, otherPlatformFee: 10.06 },
  { id: 4, date: 'Mar 24', from: 'Hotel District', to: 'Convention Center', fare: 12.50, otherPlatformFee: 4.38 },
  { id: 5, date: 'Mar 24', from: 'Airport', to: 'Suburbs', fare: 38.25, otherPlatformFee: 13.39 },
  { id: 6, date: 'Mar 24', from: 'Mall', to: 'Downtown', fare: 15.00, otherPlatformFee: 5.25 },
  { id: 7, date: 'Mar 23', from: 'Downtown', to: 'University', fare: 22.00, otherPlatformFee: 7.70 },
  { id: 8, date: 'Mar 23', from: 'Convention Center', to: 'Hotel District', fare: 11.75, otherPlatformFee: 4.11 },
];

export default function DriverEarnings() {
  const weekTotal = weeklyData.reduce((s, d) => s + d.amount, 0);
  const maxDay = Math.max(...weeklyData.map(d => d.amount));
  const totalFeesSaved = rideHistory.reduce((s, r) => s + r.otherPlatformFee, 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Earnings</h1>
          <p>Track your earnings and see how much you're saving with La Ruta.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon" style={{ background: 'var(--green-subtle)', color: 'var(--green-primary)' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-value text-green">${weekTotal.toFixed(2)}</div>
          <div className="stat-label">This Week</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon" style={{ background: 'rgba(255, 215, 64, 0.15)', color: 'var(--gold-primary)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-value text-gold">${totalFeesSaved.toFixed(2)}</div>
          <div className="stat-label">Fees Saved vs Uber/Lyft</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-icon" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-value">{rideHistory.length}</div>
          <div className="stat-label">Rides This Week</div>
        </motion.div>
      </div>

      {/* Weekly Chart */}
      <motion.div
        className="earnings-chart glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3>Weekly Earnings</h3>
        <div className="chart-bars">
          {weeklyData.map((d, i) => (
            <div key={d.day} className="chart-bar-wrapper">
              <motion.div
                className="chart-bar"
                initial={{ height: 0 }}
                animate={{ height: `${(d.amount / maxDay) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
              >
                <span className="chart-bar-value">${d.amount.toFixed(0)}</span>
              </motion.div>
              <span className="chart-bar-label">{d.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Ride History Table */}
      <motion.div
        className="earnings-table glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3>Ride History</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Route</th>
                <th>Fare</th>
                <th>You Kept</th>
                <th>Uber/Lyft Would Take</th>
              </tr>
            </thead>
            <tbody>
              {rideHistory.map(ride => (
                <tr key={ride.id}>
                  <td className="text-muted">{ride.date}</td>
                  <td>{ride.from} → {ride.to}</td>
                  <td className="text-green">${ride.fare.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-green">${ride.fare.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className="badge badge-red">-${ride.otherPlatformFee.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
