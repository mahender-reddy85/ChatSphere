import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  updateProfile: (name: string, photoURL?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
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
        // Set up presence with heartbeat and focus handling
        try {
          const presenceRef = ref(rtdb, `presence/${u.uid}`);
          
          // Initial presence
          set(presenceRef, { isOnline: true, lastSeen: rtdbTimestamp() });
          
          // Handle disconnection
          onDisconnect(presenceRef).set({ isOnline: false, lastSeen: rtdbTimestamp() });
          
          // Handle focus/blur events
          const handleFocus = () => {
            set(presenceRef, { isOnline: true, lastSeen: rtdbTimestamp() });
          };
          
          const handleBlur = () => {
            set(presenceRef, { isOnline: false, lastSeen: rtdbTimestamp() });
          };
          
          // Add event listeners
          window.addEventListener('focus', handleFocus);
          window.addEventListener('blur', handleBlur);
          
          // Set up periodic heartbeat (every 30 seconds)
          const heartbeatInterval = setInterval(() => {
            if (document.hasFocus()) {
              set(presenceRef, { isOnline: true, lastSeen: rtdbTimestamp() });
            }
          }, 30000);
          
          // Cleanup on page unload
          const cleanup = () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            clearInterval(heartbeatInterval);
            // Set offline when leaving page
            set(presenceRef, { isOnline: false, lastSeen: rtdbTimestamp() });
          };
          
          window.addEventListener('beforeunload', cleanup);
        } catch (error) {
          console.error('Failed to set up presence:', error);
        }

        // Save/load profile
        if (u.isAnonymous) {
          // Check if profile exists already
          try {
            const p = await saveUserProfile(u);
            if (p.name === "Guest") {
              setNeedsName(true);
            }
            setProfile(p);
          } catch (error) {
            console.error('Failed to save/load profile:', error);
            setNeedsName(true);
          }
        } else {
          try {
            const p = await saveUserProfile(u);
            setProfile(p);
          } catch (error) {
            console.error('Failed to save authenticated user profile:', error);
          }
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
    } catch (error) {
      console.error('Failed to save guest name:', error);
      toast.error("Failed to save name");
    }
  };

  const updateProfile = async (name: string, photoURL?: string) => {
    if (!user) return;
    try {
      const p = await saveUserProfile(user, name, photoURL);
      setProfile(p);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error("Failed to update profile");
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
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === "auth/popup-closed-by-user") return;
      if (firebaseError.code === "auth/unauthorized-domain") {
        toast.error("This domain is not authorized for Google sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.");
        return;
      }
      toast.error(firebaseError.message || "Failed to sign in with Google");
    }
  };

  const signInAsGuest = async () => {
    if (!firebaseReady) {
      toast.error("Firebase not configured");
      return;
    }
    try {
      await signInAnonymously(auth);
    } catch (error: unknown) {
      const firebaseError = error as { message?: string };
      toast.error(firebaseError.message || "Failed to sign in as guest");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!firebaseReady) {
      toast.error("Firebase not configured");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === "auth/user-not-found") {
        toast.error("No account found with this email");
      } else if (firebaseError.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (firebaseError.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else {
        toast.error(firebaseError.message || "Failed to sign in with email");
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (!firebaseReady) {
      toast.error("Firebase not configured");
      return;
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (result.user) {
        // Save user profile with name
        const p = await saveUserProfile(result.user, name);
        setProfile(p);
        toast.success("Account created successfully!");
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === "auth/email-already-in-use") {
        toast.error("An account with this email already exists");
      } else if (firebaseError.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters");
      } else if (firebaseError.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else {
        toast.error(firebaseError.message || "Failed to create account");
      }
    }
  };

  const signOut = async () => {
    if (user) {
      try {
        const presenceRef = ref(rtdb, `presence/${user.uid}`);
        await set(presenceRef, { isOnline: false, lastSeen: rtdbTimestamp() });
      } catch (error) {
        console.error('Failed to update presence on sign out:', error);
      }
    }
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, firebaseReady, needsName, setGuestName, updateProfile, signInWithGoogle, signInAsGuest, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
