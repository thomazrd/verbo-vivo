import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKKrLFYMQ0zy-L1YmUjXMNaLEBhS4Oxjk",
  authDomain: "inovai-pr4x6.firebaseapp.com",
  projectId: "inovai-pr4x6",
  storageBucket: "inovai-pr4x6.appspot.com",
  messagingSenderId: "710862373885",
  appId: "1:710862373885:web:2022633c5ea373588acf94",
  measurementId: "G-DEH2PMHWYD"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
