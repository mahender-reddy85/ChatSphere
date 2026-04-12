import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Replace with your Firebase project configuration
// These are publishable client-side keys (safe to include in code)
const firebaseConfig = {
  apiKey: "AIzaSyDW883aNWaWMRjI7edhVDaZDsmIzznvt1I",
  authDomain: "chatsphere-a5bbf.firebaseapp.com",
  projectId: "chatsphere-a5bbf",
  storageBucket: "chatsphere-a5bbf.firebasestorage.app",
  messagingSenderId: "442555540994",
  appId: "1:442555540994:web:eff7b67fc6f69b4a87291b",
  databaseURL: "https://chatsphere-a5bbf-default-rtdb.firebaseio.com",
};

export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
