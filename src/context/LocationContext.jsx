import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { doc, updateDoc, collection, onSnapshot, query, where } from 'firebase/firestore';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [position, setPosition] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const uploadTimerRef = useRef(null);
  const positionRef = useRef(null);

  // Keep positionRef in sync
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Start watching GPS position
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsTracking(true);
    setLocationError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: Date.now(),
        };
        setPosition(newPos);
        setLocationError(null);
      },
      (error) => {
        console.error('Location error:', error);
        if (error.code === 1) {
          setLocationError('Location access denied. Please enable GPS in your browser settings.');
        } else if (error.code === 2) {
          setLocationError('Unable to determine your location.');
        } else {
          setLocationError('Location request timed out. Retrying...');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (uploadTimerRef.current) {
      clearInterval(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Manual location override (when GPS is denied)
  const setManualPosition = useCallback((lat, lng) => {
    const manualPos = {
      lat,
      lng,
      accuracy: 50,
      heading: null,
      speed: null,
      timestamp: Date.now(),
    };
    setPosition(manualPos);
    setLocationError(null);
    setIsTracking(true);
  }, []);

  // Upload driver location to Firestore every 3 seconds using setInterval
  // This is more reliable than depending on useEffect dependency changes
  useEffect(() => {
    if (!user?.uid || user.role !== 'driver' || !isTracking) {
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }
      return;
    }

    // Upload immediately if we have a position
    const uploadNow = async () => {
      const pos = positionRef.current;
      if (!pos) return;

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          location: {
            lat: pos.lat,
            lng: pos.lng,
            heading: pos.heading || null,
            speed: pos.speed || null,
            accuracy: pos.accuracy || null,
            updatedAt: Date.now(),
          },
        });
      } catch (e) {
        console.error('Failed to upload location:', e);
      }
    };

    // Upload right away
    uploadNow();

    // Then upload every 3 seconds
    uploadTimerRef.current = setInterval(uploadNow, 3000);

    return () => {
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }
    };
  }, [user?.uid, user?.role, isTracking]);

  // Listen for nearby online drivers (for riders)
  useEffect(() => {
    if (!user?.uid || user.role !== 'rider') return;

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'driver'),
      where('isOnline', '==', true)
    );

    const unsub = onSnapshot(q, (snap) => {
      const drivers = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(d => d.location);
      setNearbyDrivers(drivers);
    });

    return () => unsub();
  }, [user?.uid, user?.role]);

  // Clean up on unmount
  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return (
    <LocationContext.Provider value={{
      position,
      nearbyDrivers,
      locationError,
      isTracking,
      startTracking,
      stopTracking,
      setManualPosition,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
