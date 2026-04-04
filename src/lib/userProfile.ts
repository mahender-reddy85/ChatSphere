import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

export interface UserProfile {
  name: string;
  photoURL: string;
  email: string;
  createdAt: any;
}

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=";

export const saveUserProfile = async (user: User, customName?: string) => {
  const profileRef = doc(db, "users", user.uid);
  const existing = await getDoc(profileRef);
  
  if (existing.exists() && !customName) return existing.data() as UserProfile;

  const name = customName || user.displayName || "Guest";
  const profile: UserProfile = {
    name,
    photoURL: user.photoURL || `${DEFAULT_AVATAR}${encodeURIComponent(name)}`,
    email: user.email || "",
    createdAt: serverTimestamp(),
  };

  await setDoc(profileRef, profile, { merge: true });
  return profile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};
