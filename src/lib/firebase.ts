// This file is safe to be imported on the client (browser).
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "authstart-dk3mq",
  "appId": "1:1016219162805:web:90e70c0ac44a1bfa5f46fc",
  "storageBucket": "authstart-dk3mq.appspot.com",
  "apiKey": "AIzaSyD1pai6sYqiQ6O0vx7dSli1ZvSGadIf7lg",
  "authDomain": "authstart-dk3mq.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1016219162805"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, Timestamp };
