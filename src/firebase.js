// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Based on the screenshot you provided
export const firebaseConfig = {
  apiKey: "AIzaSyD8HeiqUJ4VknzSyIUXFh6Z4Km_-ZjDlFc",
  authDomain: "marketplace-dfdea.firebaseapp.com",
  projectId: "marketplace-dfdea",
  storageBucket: "marketplace-dfdea.firebasestorage.app",
  messagingSenderId: "399350138108",
  appId: "1:399350138108:web:6e98af8194e9e60846c379"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);