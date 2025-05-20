import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Create service account object
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Debug log - check if all required properties are present
console.log('Firebase config check:', {
  projectIdExists: !!serviceAccount.projectId,
  clientEmailExists: !!serviceAccount.clientEmail,
  privateKeyExists: !!serviceAccount.privateKey?.length,
});

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export default admin;
