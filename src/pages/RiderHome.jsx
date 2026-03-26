import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRide } from '../context/RideContext';
import { useLocation } from '../context/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';
import Map from '../components/Map';
import AddressInput from '../components/AddressInput';
import { MapPin, Navigation, DollarSign, ArrowRight, Clock, Car, Search } from 'lucide-react';
import './Dashboard.css';
import './Rider.css';

export default function RiderHome() {
  const navigate = useNavigate();
  const { requestRide, activeRide } = useRide();
  const { position, nearbyDrivers, startTracking, locationError } = useLocation();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [fareEstimates, setFareEstimates] = useState(null);
  const [selectedTier, setSelectedTier] = useState('Standard');
  const [requesting, setRequesting] = useState(false);

  // Start tracking location on mount
  useEffect(() => {
    startTracking();
  }, []);

  // Redirect to ride status if there's an active ride
  useEffect(() => {
    if (activeRide) {
      navigate('/rider/status');
    }
  }, [activeRide, navigate]);

  const handlePickupSelect = (suggestion) => {
    if (suggestion) {
      setPickupCoords([suggestion.lat, suggestion.lng]);
      setFareEstimates(null);
    } else {
      setPickupCoords(null);
      setFareEstimates(null);
    }
  };

  const [vibes, setVibes] = useState([]);

  const handleDropoffSelect = (suggestion) => {
    if (suggestion) {
      setDropoffCoords([suggestion.lat, suggestion.lng]);
      setFareEstimates(null);
    } else {
      setDropoffCoords(null);
      setFareEstimates(null);
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleEstimate = () => {
    let baseFareVal = 8.00;
    let dist = 3.5;
    let estimatedMinutes = 7;
    
    if (pickupCoords && dropoffCoords) {
      dist = calculateDistance(
        pickupCoords[0], pickupCoords[1],
        dropoffCoords[0], dropoffCoords[1]
      );
      // Targeting ~10% cheaper than Uber/Lyft in El Paso
      const baseFee = 2.00;
      const perMile = 1.15;
      const perMinute = 0.20;
      estimatedMinutes = dist * 2.2; // roughly 2.2 minutes per mile in city traffic
      baseFareVal = baseFee + (perMile * dist) + (perMinute * estimatedMinutes);
      baseFareVal = Math.max(baseFareVal, 5); // Minimum $5
    } else if (pickup && dropoff) {
      baseFareVal = (Math.random() * 25 + 8);
    }

    // Helper to calculate "10:45 AM" arrival times
    const getArrivalTimeStr = (pickupDelayMinutes) => {
      const totalTime = parseInt(pickupDelayMinutes + estimatedMinutes, 10);
      const arrivalDate = new Date(Date.now() + totalTime * 60000);
      const timeStr = arrivalDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `in ${pickupDelayMinutes} min • ${timeStr}`;
    };

    setFareEstimates({
      distance: dist,
      tiers: [
        { id: 'Wait & Save', price: baseFareVal * 0.85, eta: getArrivalTimeStr(18), icon: '⏳', desc: 'Longer wait, lower price' },
        { id: 'Standard', price: baseFareVal, eta: getArrivalTimeStr(6), icon: '🚗', desc: 'Affordable, everyday rides' },
        { id: 'Priority', price: baseFareVal * 1.3, eta: getArrivalTimeStr(3), icon: '⚡', desc: 'Fastest pickup available' },
        { id: 'La Ruta XL', price: baseFareVal * 1.6, eta: getArrivalTimeStr(8), icon: '🚐', desc: 'Up to 6 people' },
        { id: 'Pets', price: baseFareVal + 4.00, eta: getArrivalTimeStr(7), icon: '🐾', desc: 'Bring your furry friend' }
      ]
    });
    setSelectedTier('Standard');
  };

  const handleRequest = async () => {
    if (!pickup || !dropoff || !fareEstimates) return;
    setRequesting(true);

    const selectedTierData = fareEstimates.tiers.find(t => t.id === selectedTier);
    const finalFare = selectedTierData ? parseFloat(selectedTierData.price.toFixed(2)) : 0;

    const pCoords = pickupCoords || (position
      ? [position.lat, position.lng]
      : [31.7619, -106.4850]);
    const dCoords = dropoffCoords || [
      pCoords[0] + (Math.random() * 0.04 - 0.02),
      pCoords[1] + (Math.random() * 0.04 - 0.02),
    ];

    let finalPickupName = pickup;
    if (pickup === 'Current Location') {
      try {
        const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${pCoords[1]},${pCoords[0]}.json?access_token=${MAPBOX_TOKEN}`);
        const data = await res.json();
        
        if (data.features && data.features.length > 0) {
          // Mapbox place_name format: "3320 Cork Drive, El Paso, Texas..."
          const primaryText = data.features[0].place_name.split(',')[0];
          finalPickupName = primaryText;
        }
      } catch (err) {
        console.error("Reverse geocode failed", err);
        finalPickupName = 'Rider Current Location';
      }
    }

    await requestRide(
      finalPickupName, 
      dropoff, 
      pCoords, 
      dCoords, 
      finalFare, 
      selectedTier,
      vibes
    );
    setRequesting(false);
    navigate('/rider/status');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Request a Ride</h1>
          <p>Enter your pickup and destination to get started.</p>
        </div>
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 'var(--space-xl)' }}
      >
        <Map
          userPosition={position}
          drivers={nearbyDrivers}
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords}
          showRoute={!!(pickupCoords && dropoffCoords)}
          dropoffLabel={fareEstimates && selectedTier 
            ? `Arrive ${fareEstimates.tiers.find(t => t.id === selectedTier)?.eta.split('• ')[1] || ''}` 
            : null}
        />
        {locationError && (
          <p style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', marginTop: 'var(--space-sm)' }}>
            ⚠️ {locationError}
          </p>
        )}
      </motion.div>

      {/* Ride Request Form */}
      <motion.div
        layout
        className="ride-request glass-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
      >
        <div className="ride-form">
          <div className="ride-inputs">
            <AddressInput
              label="Pickup Location"
              placeholder="Search for pickup address..."
              value={pickup}
              onChange={setPickup}
              onSelect={handlePickupSelect}
              dotColor="green"
              userPosition={position}
            />
            <div className="ride-input-line" style={{ marginLeft: '5px' }} />
            <AddressInput
              label="Destination"
              placeholder="Search for destination..."
              value={dropoff}
              onChange={setDropoff}
              onSelect={handleDropoffSelect}
              dotColor="gold"
              userPosition={position}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="btn btn-primary"
            onClick={handleEstimate}
            disabled={!pickup || !dropoff}
            style={{ width: '100%' }}
          >
            <Search size={16} /> Get Fare Estimate
          </motion.button>
        </div>

        <AnimatePresence>
        {fareEstimates && (
          <motion.div
            layout
            className="ride-tiers"
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            style={{ marginTop: 'var(--space-md)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Choose a Ride</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {fareEstimates.distance.toFixed(1)} mi • {Math.round(fareEstimates.distance * 2.2)} min drive
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-md)' }}>
              {fareEstimates.tiers.map((tier) => (
                <div 
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedTier === tier.id ? 'var(--green-primary)' : 'rgba(255,255,255,0.05)'}`,
                    background: selectedTier === tier.id ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontSize: '24px', marginRight: '16px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '50%' }}>
                    {tier.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{tier.id}</span>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>${tier.price.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tier.eta}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tier.desc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vibe Check Tags */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Pre-Ride Vibe Check (Optional)</p>
              <div className="vibe-scroll-container" style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {['🤫 Quiet Ride', '🎶 Aux Cord', '❄️ A/C Full Blast', '🗣️ Talkative', '🐾 Pets Allowed', '☕ Coffee Run', '🍫 Snacks Available'].map(tag => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={tag}
                    onClick={() => {
                      setVibes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                    }}
                    style={{
                      whiteSpace: 'nowrap',
                      background: vibes.includes(tag) ? 'var(--blue-dark)' : 'rgba(255,255,255,0.05)',
                      color: vibes.includes(tag) ? 'var(--blue-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${vibes.includes(tag) ? 'var(--blue-primary)' : 'rgba(255,255,255,0.1)'}`,
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      flexShrink: 0,
                      outline: 'none',
                    }}
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>
              <style>{`
                .vibe-scroll-container::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary btn-lg"
              onClick={handleRequest}
              disabled={requesting}
              style={{ width: '100%' }}
            >
              {requesting ? 'Requesting...' : `Request ${selectedTier}`} <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>

      {/* Nearby Drivers */}
      <motion.div
        className="nearby-drivers glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3>Drivers Near You ({nearbyDrivers.length} online)</h3>
        {nearbyDrivers.length > 0 ? (
          <div className="drivers-list">
            {nearbyDrivers.map(driver => (
              <div key={driver.uid} className="driver-card">
                <div className="driver-avatar">
                  {driver.name?.charAt(0) || '?'}
                </div>
                <div className="driver-info">
                  <span className="driver-name">{driver.name}</span>
                  <span className="driver-car">La Ruta Driver</span>
                </div>
                <div className="driver-meta">
                  <span className="driver-rating">⭐ {driver.rating || '4.9'}</span>
                  <span className="driver-eta">
                    <Clock size={12} /> Online
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 'var(--space-xl)' }}>
            No drivers online right now. Check back soon!
          </p>
        )}
      </motion.div>
    </div>
  );
}
