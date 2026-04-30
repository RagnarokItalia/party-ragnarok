import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5HWaP9-s5X_2aZ-p4wm1zMJ-_PfMJk1M",
  authDomain: "partyragnarok-91b64.firebaseapp.com",
  projectId: "partyragnarok-91b64",
  storageBucket: "partyragnarok-91b64.firebasestorage.app",
  messagingSenderId: "1040785630407",
  appId: "1:1040785630407:web:3d2260ee2f3186f227cae2",
   measurementId: "G-WFGHSMMDY0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);