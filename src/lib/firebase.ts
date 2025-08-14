
// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Timestamp, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "drivershield",
  "appId": "1:688007961476:web:0bf3aa76adba59f7781bd1",
  "storageBucket": "drivershield.appspot.com",
  "apiKey": "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  "authDomain": "drivershield.firebaseapp.com",
  "measurementId": "G-BKJYEF2X6Y",
  "messagingSenderId": "688007961476"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { Timestamp, serverTimestamp };
