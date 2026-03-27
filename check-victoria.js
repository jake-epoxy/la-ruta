import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5fxw15twsd-NSA-ioSzJhAa4vZh_tI8Y",
  authDomain: "la-ruta-97648.firebaseapp.com",
  projectId: "la-ruta-97648",
  storageBucket: "la-ruta-97648.firebasestorage.app",
  appId: "1:98198766806:web:812383fa7ec00dce383577"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const q = query(collection(db, 'users'), where('role', '==', 'driver'));
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} drivers in total.`);
  
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`Driver: ${data.name || 'Unknown'}\n  Phone: ${data.phone}\n  isOnline: ${data.isOnline}\n  UID: ${doc.id}\n`);
  });
  
  process.exit(0);
}

check().catch(console.error);
