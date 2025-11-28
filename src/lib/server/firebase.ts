// This file is for server-side Firebase initialization only.
// It should NOT have "use client" directive.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  authDomain: "drivershield.firebaseapp.com",
  projectId: "drivershield",
  storageBucket: "drivershield.appspot.com",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:0bf3aa76adba59f7781bd1",
};

// Initialize Firebase for the server
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
