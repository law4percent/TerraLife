import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from 'firebase/database'; // Correct import for Realtime Database

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMG7DcduDIWaMJJEt2HGVTh8MCApRQeds",
  authDomain: "terralife-4af43.firebaseapp.com",
  projectId: "terralife-4af43",
  storageBucket: "terralife-4af43.firebasestorage.app",
  messagingSenderId: "557802192837",
  appId: "1:557802192837:web:ae4f93d5149dd75806d5ac",
  measurementId: "G-5RZ2YY2G9H",
  databaseURL: "https://terralife-4af43-default-rtdb.firebaseio.com", // Add the database URL here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firebase Realtime Database
const database = getDatabase(app); // Correct initialization for Realtime Database

export { app, auth, database }; // Export the correct database