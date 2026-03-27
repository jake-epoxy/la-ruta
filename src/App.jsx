import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, NavLink } from 'react-router-dom';
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
import Privacy from './pages/Privacy';
import DriverDashboard from './pages/DriverDashboard';
import DriverEarnings from './pages/DriverEarnings';
import DriverSubscription from './pages/DriverSubscription';
import DriverSchedule from './pages/DriverSchedule';
import RiderHome from './pages/RiderHome';
import RiderRideStatus from './pages/RiderRideStatus';
import RiderHistory from './pages/RiderHistory';
import RiderSchedule from './pages/RiderSchedule';
import AdminDashboard from './pages/AdminDashboard';
import {
  LayoutDashboard, DollarSign, CreditCard, MapPin, Navigation, Clock, Calendar, ArrowLeftRight
} from 'lucide-react';
import './App.css';

function MobileBottomNav() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const driverLinks = [
    { to: '/driver', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/driver/schedule', icon: Calendar, label: 'Schedule' },
    { to: '/driver/earnings', icon: DollarSign, label: 'Earnings' },
  ];

  const riderLinks = [
    { to: '/rider', icon: MapPin, label: 'Ride', end: true },
    { to: '/rider/status', icon: Navigation, label: 'Status' },
    { to: '/rider/schedule', icon: Calendar, label: 'Schedule' },
  ];

  const links = user.role === 'driver' ? driverLinks : riderLinks;

  const handleSwitch = async () => {
    const newRole = user.role === 'driver' ? 'rider' : 'driver';
    if (window.confirm(`Switch to ${newRole === 'driver' ? 'Driver' : 'Rider'} mode?`)) {
      await switchRole();
      navigate(newRole === 'driver' ? '/driver' : '/rider');
    }
  };

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
      <button className="bottom-nav-item bottom-nav-switch" onClick={handleSwitch}>
        <ArrowLeftRight size={20} />
        <span>{user.role === 'driver' ? 'Rider' : 'Driver'}</span>
      </button>
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
            <Route path="/privacy" element={<Privacy />} />

            <Route path="/driver" element={
              <ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>
            } />
            <Route path="/driver/earnings" element={
              <ProtectedRoute role="driver"><DriverEarnings /></ProtectedRoute>
            } />
            <Route path="/driver/subscription" element={
              <ProtectedRoute role="driver"><DriverSubscription /></ProtectedRoute>
            } />
            <Route path="/driver/schedule" element={
              <ProtectedRoute role="driver"><DriverSchedule /></ProtectedRoute>
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
            <Route path="/rider/schedule" element={
              <ProtectedRoute role="rider"><RiderSchedule /></ProtectedRoute>
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
