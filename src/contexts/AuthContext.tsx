import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { ref, set, onDisconnect, serverTimestamp as rtdbTimestamp } from "firebase/database";
import { auth, googleProvider, rtdb, isFirebaseConfigured } from "@/lib/firebase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      // Set up presence
      if (u) {
        try {
          const presenceRef = ref(rtdb, `presence/${u.uid}`);
          set(presenceRef, { isOnline: true, lastSeen: rtdbTimestamp() });
          onDisconnect(presenceRef).set({ isOnline: false, lastSeen: rtdbTimestamp() });
        } catch {
          // RTDB not configured, skip presence
        }
      }
    });
    return unsubscribe;
  }, [firebaseReady]);

  const signInWithGoogle = async () => {
    if (!firebaseReady) {
      toast.error("Firebase not configured. Please add your Firebase config in src/lib/firebase.ts");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  const signInAsGuest = async () => {
    if (!firebaseReady) {
      toast.error("Firebase not configured. Please add your Firebase config in src/lib/firebase.ts");
      return;
    }
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in as guest");
    }
  };

  const signOut = async () => {
    if (user) {
      try {
        const presenceRef = ref(rtdb, `presence/${user.uid}`);
        await set(presenceRef, { isOnline: false, lastSeen: rtdbTimestamp() });
      } catch {
        // ignore
      }
    }
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, firebaseReady, signInWithGoogle, signInAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
