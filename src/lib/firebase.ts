// This file is safe to be imported on the server or client.
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache,
  enableNetwork
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

const app = !getApps().length ? initializeApp(FIREBASE_CLIENT_CONFIG) : getApp();

// Initialize Firestore with persistent local cache to prevent "Client is offline" issues.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

// Force enable network to avoid "Client is offline" issues in some environments.
// This should only run on the client.
if (typeof window !== 'undefined') {
  enableNetwork(db).catch(err => {
    console.error("Failed to enable Firestore network:", err);
  });
}


const auth = getAuth(app);

export { db, auth };