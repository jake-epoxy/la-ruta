import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5fxw15twsd-NSA-ioSzJhAa4vZh_tI8Y",
  authDomain: "la-ruta-97648.firebaseapp.com",
  projectId: "la-ruta-97648",
  storageBucket: "la-ruta-97648.firebasestorage.app",
  messagingSenderId: "98198766806",
  appId: "1:98198766806:web:812383fa7ec00dce383577",
  measurementId: "G-WYZ15XZQP5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
