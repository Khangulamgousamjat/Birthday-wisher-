import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCF6vx1NR69l40D4WmMZ5SnXEjILt9sU5g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "birthday-wisher-aa20e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "birthday-wisher-aa20e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "birthday-wisher-aa20e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1039597509897",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1039597509897:web:91664f18cc3783ab0047d8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TS4VX7GZ3S",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
