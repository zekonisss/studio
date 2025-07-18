
// This file is safe to be imported on the server or client.
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { 
  getFirestore, 
  enableNetwork,
  Timestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const FIREBASE_CLIENT_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  authDomain: "drivershield.firebaseapp.com",
  projectId: "drivershield",
  storageBucket: "drivershield.appspot.com",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:d6d663ef7430182d781bd1",
  measurementId: "G-WWHPWT8FGC"
};

const getFirebaseApp = () => {
    if (typeof window === 'undefined') {
        // This is the server-side rendering, return null or a mock object.
        return null; 
    }
    return !getApps().length ? initializeApp(FIREBASE_CLIENT_CONFIG) : getApp();
}

const app = getFirebaseApp();

// Initialize Firestore and Auth only if the app object is valid (i.e., on the client)
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

// Enable Firestore network only in the browser and if db is initialized
if (db) {
  enableNetwork(db).then(() => {
    console.log("✅ Firestore network enabled.");
  }).catch(err => {
    console.error("❌ Error enabling Firestore network:", err);
  });
}

// Throw an error if trying to use db or auth on the server.
const getDb = () => {
    if (!db) throw new Error("Firestore is not initialized. Ensure you are on the client-side.");
    return db;
}

const getAuthInstance = () => {
    if (!auth) throw new Error("Auth is not initialized. Ensure you are on the client-side.");
    return auth;
}


export { getDb, getAuthInstance, Timestamp };
