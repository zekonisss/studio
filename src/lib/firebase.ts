
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  authDomain: "drivershield.firebaseapp.com",
  projectId: "drivershield",
  storageBucket: "drivershield.appspot.com",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:0bf3aa76adba59f7781bd1",
  measurementId: "G-BKJYEF2X6Y"
};

let app: FirebaseApp;
let db: Firestore;

const databaseId = "drivercheck";

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    db = initializeFirestore(app, { 
        experimentalForceLongPolling: true, 
        localCache: { kind: 'memory' } 
    }, databaseId);
} else {
    app = getApp();
    db = getFirestore(app, databaseId); 
}

const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
