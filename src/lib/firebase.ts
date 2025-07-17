
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// =================================================================
// Konfigūracija atnaujinta su Jūsų projekto duomenimis.
// =================================================================
const FIREBASE_CLIENT_CONFIG = {
  apiKey: "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  authDomain: "drivershield.firebaseapp.com",
  projectId: "drivershield",
  storageBucket: "drivershield-storage.appspot.com",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:d6d663ef7430182d781bd1",
  measurementId: "G-WWHPWT8FGC"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(FIREBASE_CLIENT_CONFIG) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
