import { BrowserRouter as Router, Routes, Route, useLocation, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RideProvider } from './context/RideContext';
import { LocationProvider } from './context/LocationContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Terms from './pages/Terms';
import DriverDashboard from './pages/DriverDashboard';
import DriverEarnings from './pages/DriverEarnings';
import DriverSubscription from './pages/DriverSubscription';
import RiderHome from './pages/RiderHome';
import RiderRideStatus from './pages/RiderRideStatus';
import RiderHistory from './pages/RiderHistory';
import AdminDashboard from './pages/AdminDashboard';
import {
  LayoutDashboard, DollarSign, CreditCard, MapPin, Navigation, Clock
} from 'lucide-react';
import './App.css';

function MobileBottomNav() {
  const { user } = useAuth();
  if (!user) return null;

  const driverLinks = [
    { to: '/driver', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/driver/earnings', icon: DollarSign, label: 'Earnings' },
    { to: '/driver/subscription', icon: CreditCard, label: 'Plan' },
  ];

  const riderLinks = [
    { to: '/rider', icon: MapPin, label: 'Ride', end: true },
    { to: '/rider/status', icon: Navigation, label: 'Status' },
    { to: '/rider/history', icon: Clock, label: 'History' },
  ];

  const links = user.role === 'driver' ? driverLinks : riderLinks;

  return (
    <nav className="mobile-bottom-nav">
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <link.icon size={20} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/driver') || location.pathname.startsWith('/rider');

  return (
    <>
      <Navbar />
      {isDashboard && <Sidebar />}
      <div className={isDashboard ? 'dashboard-layout' : ''}>
        {isDashboard && <div className="sidebar-spacer" />}
        <main className={isDashboard ? 'dashboard-main' : ''}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/terms" element={<Terms />} />

            <Route path="/driver" element={
              <ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>
            } />
            <Route path="/driver/earnings" element={
              <ProtectedRoute role="driver"><DriverEarnings /></ProtectedRoute>
            } />
            <Route path="/driver/subscription" element={
              <ProtectedRoute role="driver"><DriverSubscription /></ProtectedRoute>
            } />

            <Route path="/rider" element={
              <ProtectedRoute role="rider"><RiderHome /></ProtectedRoute>
            } />
            <Route path="/rider/status" element={
              <ProtectedRoute role="rider"><RiderRideStatus /></ProtectedRoute>
            } />
            <Route path="/rider/history" element={
              <ProtectedRoute role="rider"><RiderHistory /></ProtectedRoute>
            } />

            <Route path="/admin" element={
              user?.email?.toLowerCase() === 'jakeflowers222@gmail.com' 
                ? <AdminDashboard /> 
                : <div style={{padding: '4rem 2rem', textAlign: 'center', color: '#ff5252'}}><h2>403 Access Denied</h2><p>You do not have master admin privileges.</p></div>
            } />
          </Routes>
        </main>
      </div>
      {isDashboard && <MobileBottomNav />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <RideProvider>
        <LocationProvider>
          <Router>
            <AppLayout />
          </Router>
        </LocationProvider>
      </RideProvider>
    </AuthProvider>
  );
}

export default App;
