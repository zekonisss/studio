// SERVER-SIDE Firebase inicializacija – JOKIO "use client" čia!

import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  authDomain: "drivershield.firebaseapp.com",
  projectId: "drivershield",
  storageBucket: "drivershield.appspot.com",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:0bf3aa76adba59f7781bd1",
  measurementId: "G-BKJYEF2X6Y",
};

// App inicializuojam atskirai serverio aplinkai.
// getApps() saugo nuo "Firebase App named '[DEFAULT]' already exists" klaidų.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Čia gaunam Firestore instanciją serveriui
export const db: Firestore = getFirestore(app);
