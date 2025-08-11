
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCKKrLFYMQ0zy-L1YmUjXMNaLEBhS4Oxjk",
  authDomain: "inovai-pr4x6.firebaseapp.com",
  projectId: "inovai-pr4x6",
  storageBucket: "inovai-pr4x6.appspot.com",
  messagingSenderId: "710862373885",
  appId: "1:710862373885:web:2022633c5ea373588acf94",
  measurementId: "G-DEH2PMHWYD"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn("Firestore offline persistence failed: Multiple tabs open.");
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn("Firestore offline persistence failed: Browser not supported.");
    }
});

export { app, auth, db, storage, googleProvider };
