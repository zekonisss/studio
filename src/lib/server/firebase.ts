// SERVER-SIDE Firebase initialization – NO "use client" here!

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  authDomain: "drivercheck-b8523.firebaseapp.com",
  projectId: "drivercheck",
  storageBucket: "drivercheck.appspot.com",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:0bf3aa76adba59f7781bd1",
  measurementId: "G-BKJYEF2X6Y",
};

// Initialize Firebase without creating duplicates
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore in SERVER MODE
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
