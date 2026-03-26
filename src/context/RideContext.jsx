import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';

const RideContext = createContext(null);

export function RideProvider({ children }) {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);

  // Listen to ALL active rides and filter client-side
  // (avoids needing Firestore composite indexes)
  useEffect(() => {
    if (!user?.uid) {
      setActiveRide(null);
      setAvailableRides([]);
      setRideHistory([]);
      return;
    }

    const unsub = onSnapshot(collection(db, 'rides'), (snap) => {
      const allRides = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const activeStatuses = ['requested', 'accepted', 'arriving', 'inprogress'];
      const doneStatuses = ['completed', 'cancelled', 'cancelled_by_rider', 'cancelled_by_driver'];

      if (user.role === 'rider') {
        // Rider's active ride
        const myActive = allRides.find(r =>
          r.riderId === user.uid && activeStatuses.includes(r.status)
        );
        
        // Alert rider if their driver cancelled
        if (!myActive && activeRide && activeRide.driverId) {
          const justCancelled = allRides.find(r => r.id === activeRide.id && r.status === 'cancelled_by_driver');
          if (justCancelled) {
            alert("Your driver had to cancel the ride. Please request a new one from the dashboard.");
          }
        }
        
        setActiveRide(myActive || null);

        // Rider's ride history
        const myHistory = allRides
          .filter(r => r.riderId === user.uid && doneStatuses.includes(r.status))
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
        setRideHistory(myHistory);
      }

      if (user.role === 'driver') {
        // Driver's active ride
        const myActive = allRides.find(r =>
          r.driverId === user.uid && activeStatuses.includes(r.status)
        );

        // Alert driver if their accepted rider cancelled
        if (!myActive && activeRide && activeRide.status !== 'requested') {
          const justCancelled = allRides.find(r => r.id === activeRide.id && r.status === 'cancelled_by_rider');
          if (justCancelled) {
            alert("The rider cancelled the pick-up. You are now available for new rides.");
          }
        }

        setActiveRide(myActive || null);

        // Available ride requests (no driver assigned yet)
        const available = allRides
          .filter(r => r.status === 'requested' && !r.driverId)
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
        setAvailableRides(available);

        // Driver's ride history
        const myHistory = allRides
          .filter(r => r.driverId === user.uid && doneStatuses.includes(r.status))
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
        setRideHistory(myHistory);
      }
    });

    return () => unsub();
  }, [user?.uid, user?.role]);

  // Rider: Request a ride
  const requestRide = useCallback(async (pickup, dropoff, pickupCoords, dropoffCoords, fareEstimate, tier = 'Standard') => {
    if (!user?.uid) return null;

    const rideData = {
      riderId: user.uid,
      riderName: user.name,
      riderEmail: user.email,
      riderPhone: user.phone || null,
      driverId: null,
      driverName: null,
      driverPhone: null,
      pickup,
      dropoff,
      pickupCoords: { lat: pickupCoords[0], lng: pickupCoords[1] },
      dropoffCoords: { lat: dropoffCoords[0], lng: dropoffCoords[1] },
      fare: fareEstimate,
      tier,
      status: 'requested',
      createdAt: serverTimestamp(),
      acceptedAt: null,
      completedAt: null,
    };

    const docRef = await addDoc(collection(db, 'rides'), rideData);
    return docRef.id;
  }, [user]);

  // Driver: Accept a ride
  const acceptRide = useCallback(async (rideId) => {
    if (!user?.uid) return;

    await updateDoc(doc(db, 'rides', rideId), {
      driverId: user.uid,
      driverName: user.name,
      driverPhone: user.phone || null,
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });
  }, [user]);

  // Update ride status
  const updateRideStatus = useCallback(async (rideId, status) => {
    const updates = { status };
    if (status === 'completed') {
      updates.completedAt = serverTimestamp();
    }
    await updateDoc(doc(db, 'rides', rideId), updates);
  }, []);

  // Cancel a ride
  const cancelRide = useCallback(async (rideId, actor = 'rider') => {
    // actor can be 'rider' or 'driver'
    const statusStr = actor === 'driver' ? 'cancelled_by_driver' : 'cancelled_by_rider';
    
    await updateDoc(doc(db, 'rides', rideId), {
      status: statusStr,
      completedAt: serverTimestamp(),
    });
  }, []);

  return (
    <RideContext.Provider value={{
      activeRide,
      availableRides,
      rideHistory,
      requestRide,
      acceptRide,
      updateRideStatus,
      cancelRide,
    }}>
      {children}
    </RideContext.Provider>
  );
}

export const useRide = () => useContext(RideContext);
