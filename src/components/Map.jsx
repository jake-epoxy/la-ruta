import { useEffect, useRef, useState, useMemo } from 'react';
import MapGL, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import { LocateFixed } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Visuals for 3D Buildings
const buildingsLayer = {
  id: '3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion',
  minzoom: 14,
  paint: {
    'fill-extrusion-color': '#2a2a35',
    'fill-extrusion-height': [
      'interpolate', ['linear'], ['zoom'],
      14, 0,
      14.05, ['get', 'height']
    ],
    'fill-extrusion-base': [
      'interpolate', ['linear'], ['zoom'],
      14, 0,
      14.05, ['get', 'min_height']
    ],
    'fill-extrusion-opacity': 0.8
  }
};

// Visuals for Neon Route
const routeLayerBase = {
  id: 'route-line-base',
  type: 'line',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: { 'line-color': '#00e676', 'line-width': 5, 'line-opacity': 1.0 }
};

const routeLayerGlow = {
  id: 'route-line-glow',
  type: 'line',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: { 'line-color': '#00e676', 'line-width': 12, 'line-opacity': 0.3, 'line-blur': 4 }
};

export default function Map({
  center = [31.7619, -106.4850], // [lat, lon]
  zoom = 14,
  drivers = [],
  pickupCoords = null,
  dropoffCoords = null,
  userPosition = null,
  showRoute = false,
  followDriver = false,
  tall = false,
  style = {},
  className = '',
  dropoffLabel = null,
  focusCoords = null,
}) {
  const mapRef = useRef(null);
  const [routePath, setRoutePath] = useState(null); 
  const [isUserDragging, setIsUserDragging] = useState(false);
  const [hasCenteredOnce, setHasCenteredOnce] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: center[0],
    longitude: center[1],
    zoom: zoom,
    pitch: 60,
    bearing: 0
  });

  // Auto-pan to user's exact GPS location on initial load
  useEffect(() => {
    if (userPosition && !hasCenteredOnce && !pickupCoords && !dropoffCoords && !followDriver) {
      setViewState(prev => ({
        ...prev,
        latitude: userPosition.lat,
        longitude: userPosition.lng,
        zoom: 16,
        transitionDuration: 2500, // Cinematic swoop
      }));
      setHasCenteredOnce(true);
    }
  }, [userPosition, hasCenteredOnce, pickupCoords, dropoffCoords, followDriver]);

  // Reset tracking state if parent intentionally toggles follow mode
  useEffect(() => {
    if (!followDriver) setIsUserDragging(false);
  }, [followDriver]);

  // Calculate Mapbox Route
  useEffect(() => {
    let active = true;

    async function fetchRoute() {
      if (!showRoute || !pickupCoords || !dropoffCoords) {
        setRoutePath(null);
        return;
      }

      try {
        const pLat = pickupCoords[0];
        const pLng = pickupCoords[1];
        const dLat = dropoffCoords[0];
        const dLng = dropoffCoords[1];
        
        const cacheKey = `mapbox_route_v2_${pLat.toFixed(4)}_${pLng.toFixed(4)}_${dLat.toFixed(4)}_${dLng.toFixed(4)}`;
        const cachedRoute = sessionStorage.getItem(cacheKey);
        
        if (cachedRoute) {
          if (active) setRoutePath(JSON.parse(cachedRoute));
          return;
        }

        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${pLng},${pLat};${dLng},${dLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();

        if (active) {
          if (data.code === 'Ok' && data.routes?.length > 0) {
            const coords = data.routes[0].geometry.coordinates; // Mapbox returns [lon, lat] natively
            sessionStorage.setItem(cacheKey, JSON.stringify(coords));
            setRoutePath(coords);
          } else {
            console.warn('Mapbox returned no routes:', data);
            setRoutePath([[pLng, pLat], [dLng, dLat]]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch route geometry:', error);
        if (active) {
            setRoutePath([[pickupCoords[1], pickupCoords[0]], [dropoffCoords[1], dropoffCoords[0]]]);
        }
      }
    }

    fetchRoute();
    return () => { active = false; };
  }, [pickupCoords?.[0], pickupCoords?.[1], dropoffCoords?.[0], dropoffCoords?.[1], showRoute]);

  // Handle Automated Camera Tracking
  useEffect(() => {
    if (focusCoords) {
      setIsUserDragging(false);
      setViewState(prev => ({
        ...prev,
        latitude: focusCoords[0],
        longitude: focusCoords[1],
        zoom: 17.5,
        pitch: 60,
        bearing: prev.bearing + 45, // Add cinematic spin
        transitionDuration: 2000,
      }));
    } else if (followDriver && !isUserDragging && drivers.length > 0 && drivers[0].location) {
      const driver = drivers[0];
      setViewState(prev => ({
        ...prev,
        latitude: driver.location.lat,
        longitude: driver.location.lng,
        zoom: 16.5,
        pitch: 60, // True 3D Tilt
        bearing: driver.heading || 0, // Auto-rotate map if heading is available
        transitionDuration: 1500,
      }));
    } else if (pickupCoords && dropoffCoords && routePath && !followDriver && !hasCenteredOnce) {
        // Fit bounds around route if not tracking live driver
        if (mapRef.current) {
            // Calculate bbox [minX, minY, maxX, maxY]
            const bounds = routePath.reduce((acc, coord) => [
                Math.min(acc[0], coord[0]), Math.min(acc[1], coord[1]),
                Math.max(acc[2], coord[0]), Math.max(acc[3], coord[1])
            ], [180, 90, -180, -90]);
            
            mapRef.current.fitBounds([
                [bounds[0], bounds[1]], 
                [bounds[2], bounds[3]]
            ], { padding: 60, duration: 1500 });
        }
    }
  }, [followDriver, drivers[0]?.location?.lat, drivers[0]?.location?.lng, routePath]);

  // Generate GeoJSON source for Route
  const routeGeoJSON = useMemo(() => {
    if (!routePath) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: routePath }
    };
  }, [routePath]);

  return (
    <div className={`map-wrapper mapbox-container ${tall ? 'map-tall' : ''} ${className}`} style={style}>
      <MapGL
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onDragStart={() => followDriver && !isUserDragging && setIsUserDragging(true)}
        onZoomStart={() => followDriver && !isUserDragging && setIsUserDragging(true)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
      >
        <Layer {...buildingsLayer} />
        
        {/* Render Neon Route if exists */}
        {showRoute && routeGeoJSON && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer {...routeLayerGlow} />
            <Layer {...routeLayerBase} />
          </Source>
        )}

        {/* Drivers */}
        {drivers.map(driver => (
          driver.location && (
            <Marker 
              key={driver.uid}
              longitude={driver.location.lng} 
              latitude={driver.location.lat}
              anchor="center"
              style={{ transition: 'transform 2.5s cubic-bezier(0.2, 0.8, 0.2, 1)' }} // CSS animation for smooth car movement
            >
              <div className="driver-marker-outer" style={{ transform: `rotate(${driver.heading || 0}deg)` }}>
                <div className="driver-marker-inner" style={{ fontSize: '24px' }}>🚗</div>
              </div>
            </Marker>
          )
        ))}

        {/* Pickup Location */}
        {pickupCoords && (
          <Marker longitude={pickupCoords[1]} latitude={pickupCoords[0]} anchor="bottom">
            <div className="location-marker pickup">
              <div className="location-marker-dot"></div>
              <div className="location-marker-label" style={{ background: '#00e676', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>PICKUP</div>
            </div>
          </Marker>
        )}

        {/* Dropoff Location */}
        {dropoffCoords && (
           <Marker longitude={dropoffCoords[1]} latitude={dropoffCoords[0]} anchor="bottom">
             <div className="location-marker dropoff">
               <div className="location-marker-dot"></div>
               <div className="location-marker-badge" style={{ background: dropoffLabel?.includes('Arrive') ? '#111' : '#fbc02d', color: dropoffLabel?.includes('Arrive') ? '#fff' : '#000', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', whiteSpace: 'nowrap'}}>
                 {dropoffLabel || 'DROP-OFF'}
               </div>
             </div>
           </Marker>
        )}

        {/* Local User GPS Position (Rider looking at map) */}
        {userPosition && (
            <Marker longitude={userPosition.lng} latitude={userPosition.lat} anchor="center">
               <div className="user-marker-outer">
                 <div className="user-marker-inner" style={{ background: '#4285f4', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 10px rgba(66, 133, 244, 0.8)' }}></div>
               </div>
            </Marker>
        )}
      </MapGL>
      
      {/* Floating Recenter Button */}
      {followDriver && isUserDragging && (
        <button
          className="glass-card"
          onClick={(e) => {
            e.stopPropagation();
            setIsUserDragging(false);
          }}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 15,
            zIndex: 10,
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--green-primary)',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            background: 'rgba(10, 14, 26, 0.85)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            cursor: 'pointer'
          }}
        >
          <LocateFixed size={22} />
        </button>
      )}

      {/* HUD GPS Quality Badge */}
      {userPosition?.accuracy && (
        <div className="gps-badge" style={{ zIndex: 10, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '12px', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: userPosition.accuracy < 20 ? '#00e676' : '#fbc02d', marginRight: 6 }} />
          {userPosition.accuracy < 20 ? 'Precise GPS' : 'Fair GPS'}
        </div>
      )}
    </div>
  );
}
