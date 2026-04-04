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
import { saveUserProfile, UserProfile } from "@/lib/userProfile";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  firebaseReady: boolean;
  needsName: boolean;
  setGuestName: (name: string) => Promise<void>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsName, setNeedsName] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Set up presence
        try {
          const presenceRef = ref(rtdb, `presence/${u.uid}`);
          set(presenceRef, { isOnline: true, lastSeen: rtdbTimestamp() });
          onDisconnect(presenceRef).set({ isOnline: false, lastSeen: rtdbTimestamp() });
        } catch {}

        // Save/load profile
        if (u.isAnonymous) {
          // Check if profile exists already
          try {
            const p = await saveUserProfile(u);
            if (p.name === "Guest") {
              setNeedsName(true);
            }
            setProfile(p);
          } catch {
            setNeedsName(true);
          }
        } else {
          try {
            const p = await saveUserProfile(u);
            setProfile(p);
          } catch {}
        }
      } else {
        setProfile(null);
        setNeedsName(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [firebaseReady]);

  const setGuestName = async (name: string) => {
    if (!user) return;
    try {
      const p = await saveUserProfile(user, name);
      setProfile(p);
      setNeedsName(false);
    } catch {
      toast.error("Failed to save name");
    }
  };

  const signInWithGoogle = async () => {
    if (!firebaseReady) {
      toast.error("Firebase not configured");
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await saveUserProfile(result.user);
      }
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") return;
      if (error.code === "auth/unauthorized-domain") {
        toast.error("This domain is not authorized for Google sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.");
        return;
      }
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  const signInAsGuest = async () => {
    if (!firebaseReady) {
      toast.error("Firebase not configured");
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
      } catch {}
    }
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, firebaseReady, needsName, setGuestName, signInWithGoogle, signInAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
