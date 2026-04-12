import { 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction, 
  doc, 
  arrayUnion, 
  serverTimestamp,
  addDoc,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";

export const generateInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const joinRoomByInviteCode = async (userUid: string, inviteCode: string): Promise<string> => {
  const code = inviteCode.trim().toUpperCase();
  const q = query(collection(db, "rooms"), where("inviteCode", "==", code));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Invalid invite code");
  }

  const roomDoc = snapshot.docs[0];
  const roomData = roomDoc.data();

  if (roomData.participants.includes(userUid)) {
    return roomDoc.id;
  }

  if (roomData.participants.length >= 2) {
    throw new Error("Room is full");
  }

  await runTransaction(db, async (transaction) => {
    const roomRef = doc(db, "rooms", roomDoc.id);
    const freshDoc = await transaction.get(roomRef);
    const freshData = freshDoc.data();
    
    if (!freshData) throw new Error("Room not found");
    if (freshData.participants.length >= 2) throw new Error("Room is full");
    
    transaction.update(roomRef, {
      participants: arrayUnion(userUid),
      updatedAt: serverTimestamp(),
    });
  });

  return roomDoc.id;
};

export const createRoom = async (userUid: string, chatMode: "permanent" | "temporary") => {
  const inviteCode = generateInviteCode();
  
  const roomRef = await addDoc(collection(db, "rooms"), {
    inviteCode,
    participants: [userUid],
    createdBy: userUid,
    allowJoin: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    chatMode,
    autoDeleteMinutes: chatMode === "temporary" ? 30 : null,
  });

  // Verify creation
  const roomDoc = await getDoc(roomRef);
  if (!roomDoc.exists()) {
    throw new Error("Room creation failed");
  }

  return { id: roomRef.id, inviteCode };
};
