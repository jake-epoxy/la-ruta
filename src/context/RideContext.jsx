import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  collection, doc, addDoc, updateDoc, onSnapshot, getDoc,
  query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';

const RideContext = createContext(null);

export function RideProvider({ children }) {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [scheduledRides, setScheduledRides] = useState([]);

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
        const myActiveRides = allRides
          .filter(r => r.riderId === user.uid && activeStatuses.includes(r.status))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const myActive = myActiveRides.length > 0 ? myActiveRides[0] : null;
        
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
        const myActiveRides = allRides
          .filter(r => r.driverId === user.uid && activeStatuses.includes(r.status))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const myActive = myActiveRides.length > 0 ? myActiveRides[0] : null;

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

  // ============================================================
  // SCHEDULED RIDES — Real-time listener
  // ============================================================
  useEffect(() => {
    if (!user?.uid) {
      setScheduledRides([]);
      return;
    }

    const unsub = onSnapshot(collection(db, 'scheduledRides'), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      let myScheduled;
      if (user.role === 'rider') {
        myScheduled = all.filter(r => r.riderId === user.uid);
      } else {
        // Drivers see: rides requested TO them + rides they accepted
        myScheduled = all.filter(r =>
          r.requestedDriverId === user.uid ||
          r.driverId === user.uid
        );
      }

      // Sort by scheduled time ascending (soonest first)
      myScheduled.sort((a, b) => {
        const aTime = new Date(a.scheduledTime).getTime() || 0;
        const bTime = new Date(b.scheduledTime).getTime() || 0;
        return aTime - bTime;
      });

      setScheduledRides(myScheduled);
    });

    return () => unsub();
  }, [user?.uid, user?.role]);

  // Rider: Create a scheduled ride
  const createScheduledRide = useCallback(async (data) => {
    if (!user?.uid) return null;

    const rideData = {
      riderId: user.uid,
      riderName: user.name,
      riderPhone: user.phone || null,
      driverId: null,
      driverName: null,
      pickup: data.pickup,
      dropoff: data.dropoff,
      pickupCoords: data.pickupCoords,
      dropoffCoords: data.dropoffCoords,
      scheduledTime: data.scheduledTime,
      requestedDriverId: data.requestedDriverId || null,
      requestedDriverName: data.requestedDriverName || null,
      fare: data.fare || 0,
      tier: data.tier || 'Standard',
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'scheduledRides'), rideData);
    return docRef.id;
  }, [user]);

  // Driver: Accept a scheduled ride
  const acceptScheduledRide = useCallback(async (rideId) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'scheduledRides', rideId), {
      driverId: user.uid,
      driverName: user.name,
      status: 'accepted',
    });
  }, [user]);

  // Driver: Decline a scheduled ride
  const declineScheduledRide = useCallback(async (rideId) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'scheduledRides', rideId), {
      status: 'declined',
    });
  }, [user]);

  // Cancel a scheduled ride (either party)
  const cancelScheduledRide = useCallback(async (rideId) => {
    await updateDoc(doc(db, 'scheduledRides', rideId), {
      status: 'cancelled',
    });
  }, []);

  // Fetch favorite driver details (name, phone) by UID array
  const fetchDriverDetails = useCallback(async (driverIds) => {
    if (!driverIds || driverIds.length === 0) return [];
    const details = [];
    for (const uid of driverIds) {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const d = snap.data();
          details.push({ uid, name: d.name, phone: d.phone || null, rating: d.rating || 4.9 });
        }
      } catch (e) {
        console.error('Failed to fetch driver details:', e);
      }
    }
    return details;
  }, []);

  // Rider: Request a ride
  const requestRide = useCallback(async (pickup, dropoff, pickupCoords, dropoffCoords, fareEstimate, tier = 'Standard', vibes = []) => {
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
      vibes,
      targetDriverIds: user.favoriteDrivers?.length > 0 ? user.favoriteDrivers : null,
      targetTimeoutExpires: user.favoriteDrivers?.length > 0 ? Date.now() + 30000 : null,
      status: 'requested',
      createdAt: serverTimestamp(),
      acceptedAt: null,
      completedAt: null,
    };

    const docRef = await addDoc(collection(db, 'rides'), rideData);
    
    if (rideData.targetDriverIds) {
      setTimeout(async () => {
        try {
          const rideSnap = await getDoc(docRef);
          if (rideSnap.exists() && rideSnap.data().status === 'requested') {
            await updateDoc(docRef, {
              targetDriverIds: null,
              targetTimeoutExpires: null
            });
            console.log("30s Favorite Driver lock expired — Ride is now available to the public pool.");
          }
        } catch (e) {
          console.error("Failed to release ride to public pool:", e);
        }
      }, 30000);
    }

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
    try {
      // Optimistic UI: clear immediately to bypass network lag
      if (activeRide && activeRide.id === rideId) {
        setActiveRide(null);
      }

      const statusStr = actor === 'driver' ? 'cancelled_by_driver' : 'cancelled_by_rider';
      await updateDoc(doc(db, 'rides', rideId), {
        status: statusStr,
        completedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Firebase cancel payload failed:", err);
      throw err;
    }
  }, [activeRide]);

  // Submit a tip
  const submitTip = useCallback(async (rideId, amount) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        tip: amount
      });
    } catch (err) {
      console.error("Failed to submit tip:", err);
      throw err;
    }
  }, []);

  return (
    <RideContext.Provider value={{
      activeRide,
      availableRides,
      rideHistory,
      scheduledRides,
      requestRide,
      acceptRide,
      updateRideStatus,
      cancelRide,
      submitTip,
      createScheduledRide,
      acceptScheduledRide,
      declineScheduledRide,
      cancelScheduledRide,
      fetchDriverDetails,
    }}>
      {children}
    </RideContext.Provider>
  );
}

export const useRide = () => useContext(RideContext);
