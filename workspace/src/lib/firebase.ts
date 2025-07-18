
// This file is safe to be imported on the server or client.
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { 
  getFirestore, 
  enableNetwork,
  Timestamp,
  type Firestore
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const FIREBASE_CLIENT_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  authDomain: "drivershield.firebaseapp.com",
  projectId: "drivershield",
  storageBucket: "drivershield.appspot.com",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:d6d663ef7430182d781bd1",
  measurementId: "G-WWHPWT8FGC"
};

function getFirebaseApp() {
    if (getApps().length === 0) {
        return initializeApp(FIREBASE_CLIENT_CONFIG);
    }
    return getApp();
}

let db: Firestore;
let auth: Auth;

function getDbInstance() {
    if (!db) {
        const app = getFirebaseApp();
        db = getFirestore(app);
        if (typeof window !== 'undefined') {
            enableNetwork(db).then(() => {
                console.log("✅ Firestore network enabled.");
            }).catch(err => {
                console.error("❌ Error enabling Firestore network:", err);
            });
        }
    }
    return db;
}

function getAuthInstance() {
    if (!auth) {
        const app = getFirebaseApp();
        auth = getAuth(app);
    }
    return auth;
}

export { getDbInstance, getAuthInstance, Timestamp };
