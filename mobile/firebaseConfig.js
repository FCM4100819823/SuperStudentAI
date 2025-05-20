import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Hardcoded Firebase configuration for direct test
const firebaseConfig = {
  apiKey: "AIzaSyBV9YAFfn82I33IgBFJsNMR17yBc7fvWOM",
  authDomain: "superstudent-ai.firebaseapp.com",
  projectId: "superstudent-ai",
  storageBucket: "superstudent-ai.appspot.com",
  messagingSenderId: "1002024259447",
  appId: "1:1002024259447:web:c41ef41cfa0d72aad7db72",
  measurementId: "G-B6M8V3EG1S",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export default firebase;
