import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { collection, query, where, getDocs, runTransaction, doc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

const JoinRoom = () => {
  const { code } = useParams<{ code: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!code) {
      navigate("/");
      return;
    }

    const joinByCode = async () => {
      try {
        const q = query(collection(db, "rooms"), where("inviteCode", "==", code.toUpperCase()));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          toast.error("Invalid invite code");
          navigate("/");
          return;
        }

        const roomDoc = snapshot.docs[0];
        const roomData = roomDoc.data();

        if (roomData.participants.includes(user.uid)) {
          navigate(`/chat/${roomDoc.id}`);
          return;
        }

        if (roomData.isFull || roomData.participants.length >= 2) {
          toast.error("Room is full");
          navigate("/");
          return;
        }

        await runTransaction(db, async (transaction) => {
          const roomRef = doc(db, "rooms", roomDoc.id);
          const freshDoc = await transaction.get(roomRef);
          const freshData = freshDoc.data();
          if (!freshData || freshData.participants.length >= 2) {
            throw new Error("Room is full");
          }
          transaction.update(roomRef, {
            participants: arrayUnion(user.uid),
            isFull: freshData.participants.length + 1 >= 2,
            updatedAt: serverTimestamp(),
          });
        });

        navigate(`/chat/${roomDoc.id}`);
      } catch (error: unknown) {
        const firebaseError = error as { message?: string };
        toast.error(firebaseError.message || "Failed to join room");
        navigate("/");
      }
    };

    joinByCode();
  }, [code, user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      {/* Fixed Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="flex gap-1">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.2s]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.4s]" />
      </div>
    </div>
  );
};

export default JoinRoom;
