import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot
} from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() });
        } else {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async (name, email, password, role, phone, driverPreferences = []) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      const userData = {
        name,
        email,
        phone,
        role,
        createdAt: new Date().toISOString(),
        rating: role === 'driver' ? 4.9 : null,
        subscriptionStatus: role === 'driver' ? 'trialing' : null,
        trialEndsAt: role === 'driver' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
        isOnline: false,
        location: null,
      };

      if (role === 'driver') {
        userData.driverPreferences = driverPreferences;
      }

      await setDoc(doc(db, 'users', cred.user.uid), userData);
      setUser({ uid: cred.user.uid, ...userData });
      return { success: true, user: { uid: cred.user.uid, ...userData } };
    } catch (error) {
      let message = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') message = 'Email already registered';
      if (error.code === 'auth/weak-password') message = 'Password must be at least 6 characters';
      if (error.code === 'auth/invalid-email') message = 'Invalid email address';
      return { success: false, error: message };
    }
  };

  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      const userData = { uid: cred.user.uid, email: cred.user.email, ...userDoc.data() };
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      let message = 'Invalid email or password';
      if (error.code === 'auth/user-not-found') message = 'No account found with this email';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { isOnline: false, location: null });
      } catch (e) {}
    }
    await signOut(auth);
    setUser(null);
  };

  const updateUser = async (updates) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid), updates);
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
