import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb, isFirebaseConfigured } from "@/lib/firebase";

interface PresenceData {
  isOnline: boolean;
  lastSeen: number | null;
}

export const usePresence = (uid: string | undefined) => {
  const [presence, setPresence] = useState<PresenceData>({ isOnline: false, lastSeen: null });

  useEffect(() => {
    if (!uid || !isFirebaseConfigured()) return;
    try {
      const presenceRef = ref(rtdb, `presence/${uid}`);
      const unsubscribe = onValue(presenceRef, (snapshot) => {
        if (snapshot.exists()) {
          setPresence(snapshot.val());
        }
      });
      return () => unsubscribe();
    } catch {
      // RTDB not available
    }
  }, [uid]);

  return presence;
};
