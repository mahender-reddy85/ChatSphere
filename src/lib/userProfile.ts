import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

export interface UserProfile {
  name: string;
  photoURL: string;
  email: string;
  createdAt: Timestamp;
}

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=";

export const saveUserProfile = async (user: User, customName?: string, customPhotoURL?: string) => {
  const profileRef = doc(db, "users", user.uid);
  const existing = await getDoc(profileRef);
  
  if (existing.exists() && !customName && !customPhotoURL) return existing.data() as UserProfile;

  const name = customName || user.displayName || "Guest";
  const photoURL = customPhotoURL || user.photoURL || `${DEFAULT_AVATAR}${encodeURIComponent(name)}`;
  const profile: UserProfile = {
    name,
    photoURL,
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
