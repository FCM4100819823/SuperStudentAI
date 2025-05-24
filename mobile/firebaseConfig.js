// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Import getAuth
import { getFirestore } from 'firebase/firestore'; // Import getFirestore
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyA4ga7xCPnkyrgeCZxZ267GTMsvszetIa0',
  authDomain: 'superstudentai.firebaseapp.com',
  projectId: 'superstudentai',
  storageBucket: 'superstudentai.firebasestorage.app',
  messagingSenderId: '360608510001',
  appId: '1:360608510001:web:04693d1a55a8a7169f6510',
  measurementId: 'G-S307LY0W8K',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize and get the auth instance
const firestore = getFirestore(app); // Initialize Firestore
const analytics = getAnalytics(app);

export { app, auth, firestore, analytics }; // Export app, auth, firestore, and analytics
