import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
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

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
