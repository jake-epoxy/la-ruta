import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, DollarSign, CreditCard, MapPin, Clock, Navigation
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const driverLinks = [
    { to: '/driver', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/driver/earnings', icon: DollarSign, label: 'Earnings' },
    { to: '/driver/subscription', icon: CreditCard, label: 'Subscription' },
  ];

  const riderLinks = [
    { to: '/rider', icon: MapPin, label: 'Request Ride', end: true },
    { to: '/rider/status', icon: Navigation, label: 'Ride Status' },
    { to: '/rider/history', icon: Clock, label: 'Ride History' },
  ];

  const links = user?.role === 'driver' ? driverLinks : riderLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Navigation size={20} className="text-green" />
        <span className="sidebar-title">La Ruta</span>
      </div>

      <div className="sidebar-role">
        <span className={`badge ${user?.role === 'driver' ? 'badge-green' : 'badge-gold'}`}>
          {user?.role === 'driver' ? '🚗 Driver' : '📍 Rider'}
        </span>
      </div>

      <nav className="sidebar-nav">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <link.icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-email">{user?.email}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
