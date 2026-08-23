import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA3oV0y5UT3oeL86BwOnZmfd8nAzOs3hYg",
  authDomain: "chathub-8e7d9.firebaseapp.com",
  databaseURL: "https://chathub-8e7d9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chathub-8e7d9",
  storageBucket: "chathub-8e7d9.firebasestorage.app",
  messagingSenderId: "832139477563",
  appId: "1:832139477563:web:60777cc0c6bf5ca8c0521e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
