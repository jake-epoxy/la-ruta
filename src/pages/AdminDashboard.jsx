import React, { useState, useEffect, useMemo } from 'react';
import { Home, Users, Car, AlertTriangle, CheckCircle, Activity, DollarSign, Search } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [rideSearch, setRideSearch] = useState('');

  useEffect(() => {
    // Listen to all users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen to recent rides (limit 50 to save reads)
    const q = query(collection(db, 'rides'), orderBy('createdAt', 'desc'), limit(50));
    const unsubRides = onSnapshot(q, (snap) => {
      setRides(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubRides();
    };
  }, []);

  const drivers = users.filter(u => u.role === 'driver');
  const riders = users.filter(u => u.role === 'rider');

  const activeRides = rides.filter(r => ['requested', 'accepted', 'arriving', 'inprogress'].includes(r.status));
  const completedRides = rides.filter(r => r.status === 'completed');
  
  const totalRevenue = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);

  // Smart search — matches across all ride fields
  const filteredRides = useMemo(() => {
    if (!rideSearch.trim()) return rides;
    const terms = rideSearch.toLowerCase().split(/\s+/).filter(Boolean);
    return rides.filter(ride => {
      const searchable = [
        ride.riderName,
        ride.driverName,
        ride.pickup,
        ride.dropoff,
        ride.status?.replace(/_/g, ' '),
        ride.tier,
        ride.fare ? `$${ride.fare.toFixed(2)}` : '',
        ride.createdAt?.seconds ? new Date(ride.createdAt.seconds * 1000).toLocaleDateString() : '',
      ].filter(Boolean).join(' ').toLowerCase();

      return terms.every(term => searchable.includes(term));
    });
  }, [rides, rideSearch]);

  const getTrialStatus = (driver) => {
    if (driver.subscriptionStatus === 'active') return <span className="badge badge-green">Premium</span>;
    if (!driver.trialEndsAt) return <span className="badge badge-gray">No Data</span>;
    
    const now = Date.now();
    const daysLeft = Math.ceil((driver.trialEndsAt - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft > 0) return <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>Trial ({daysLeft} days)</span>;
    return <span className="badge" style={{ background: '#ff5252' }}>Expired</span>;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--green-primary)';
      case 'inprogress': return 'var(--gold-primary)';
      case 'requesting':
      case 'accepted':
      case 'arriving': return '#fff';
      default: return '#ff5252'; // cancelled variants
    }
  };

  if (loading) {
    return (
      <div className="admin-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading Platform Data...</p>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{ 
      padding: '7rem 2rem 4rem 2rem', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      color: '#fff',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #a0a0a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Master Control</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Welcome to the La Ruta backend infrastructure.</p>
        
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          background: 'rgba(255,255,255,0.03)', 
          padding: '0.5rem', 
          borderRadius: '12px',
          width: 'fit-content',
          marginTop: '2rem',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <button 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : ''}`} 
            onClick={() => setActiveTab('overview')}
            style={{ padding: '0.75rem 1.5rem', background: activeTab !== 'overview' ? 'transparent' : 'var(--green-primary)', color: activeTab !== 'overview' ? 'var(--text-secondary)' : '#000', fontWeight: 600, border: 'none' }}
          >
            <Activity size={18} style={{ marginRight: 8 }} /> Overview
          </button>
          <button 
            className={`btn ${activeTab === 'drivers' ? 'btn-primary' : ''}`} 
            onClick={() => setActiveTab('drivers')}
            style={{ padding: '0.75rem 1.5rem', background: activeTab !== 'drivers' ? 'transparent' : 'var(--green-primary)', color: activeTab !== 'drivers' ? 'var(--text-secondary)' : '#000', fontWeight: 600, border: 'none' }}
          >
            <Car size={18} style={{ marginRight: 8 }} /> Fleet Roster
          </button>
          <button 
            className={`btn ${activeTab === 'rides' ? 'btn-primary' : ''}`} 
            onClick={() => setActiveTab('rides')}
            style={{ padding: '0.75rem 1.5rem', background: activeTab !== 'rides' ? 'transparent' : 'var(--green-primary)', color: activeTab !== 'rides' ? 'var(--text-secondary)' : '#000', fontWeight: 600, border: 'none' }}
          >
            <CheckCircle size={18} style={{ marginRight: 8 }} /> Ride Ledger
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}><Users size={16} style={{marginRight: 6}}/> Total Fleet</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{drivers.length}</div>
              <div style={{ color: 'var(--green-primary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Registered drivers</div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}><Users size={16} style={{marginRight: 6}}/> Total Riders</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{riders.length}</div>
              <div style={{ color: 'var(--green-primary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Passenger accounts</div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}><Activity size={16} style={{marginRight: 6}}/> Live Rides</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{activeRides.length}</div>
              <div style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Currently on road</div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}><DollarSign size={16} style={{marginRight: 6}}/> GMV (Completed)</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>${totalRevenue.toFixed(2)}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Driver gross earnings</div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'drivers' && (
        <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Driver Roster</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Phone</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{d.email}</td>
                  <td style={{ padding: '1rem' }}>{d.phone || '-'}</td>
                  <td style={{ padding: '1rem' }}>{getTrialStatus(d)}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No drivers registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {activeTab === 'rides' && (
        <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Ride Ledger</h3>
            {/* Smart Search */}
            <div style={{ position: 'relative', flex: '1', maxWidth: '400px', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="🔍 Search rides... (name, status, location, tier)"
                value={rideSearch}
                onChange={(e) => setRideSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--green-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              {rideSearch && (
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {filteredRides.length} result{filteredRides.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Date/Time</th>
                <th style={{ padding: '1rem' }}>Rider</th>
                <th style={{ padding: '1rem' }}>Driver</th>
                <th style={{ padding: '1rem' }}>Route</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Fare</th>
                <th style={{ padding: '1rem' }}>Tier</th>
              </tr>
            </thead>
            <tbody>
              {filteredRides.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{r.riderName || '-'}</td>
                  <td style={{ padding: '1rem' }}>{r.driverName || <span style={{color: 'var(--text-muted)'}}>Pending</span>}</td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                    {r.pickup && <div>📍 {r.pickup}</div>}
                    {r.dropoff && <div>🏁 {r.dropoff}</div>}
                  </td>
                  <td style={{ padding: '1rem', color: getStatusColor(r.status), fontWeight: 600 }}>
                    {r.status.replace(/_/g, ' ').toUpperCase()}
                  </td>
                  <td style={{ padding: '1rem' }}>${(r.fare || 0).toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}><span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>{r.tier || 'Standard'}</span></td>
                </tr>
              ))}
              {filteredRides.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {rideSearch ? `No rides matching "${rideSearch}"` : 'No rides requested yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
