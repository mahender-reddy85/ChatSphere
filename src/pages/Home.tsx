import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  runTransaction,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, LogIn, LogOut, Copy, MessageSquare } from "lucide-react";

const generateInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCreateRoom = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const inviteCode = generateInviteCode();
      const roomRef = await addDoc(collection(db, "rooms"), {
        inviteCode,
        participants: [user.uid],
        isFull: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
      });
      toast.success("Room created!", {
        description: `Invite code: ${inviteCode}`,
        action: {
          label: "Copy",
          onClick: () => navigator.clipboard.writeText(inviteCode),
        },
      });
      navigate(`/chat/${roomRef.id}`);
    } catch (error) {
      toast.error("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    try {
      const code = joinCode.trim().toUpperCase();
      const q = query(collection(db, "rooms"), where("inviteCode", "==", code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("Invalid invite code");
        setJoining(false);
        return;
      }

      const roomDoc = snapshot.docs[0];
      const roomData = roomDoc.data();

      // Already a participant
      if (roomData.participants.includes(user.uid)) {
        navigate(`/chat/${roomDoc.id}`);
        return;
      }

      if (roomData.isFull || roomData.participants.length >= 2) {
        toast.error("Room is full");
        setJoining(false);
        return;
      }

      // Use transaction to prevent race conditions
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
    } catch (error: any) {
      toast.error(error.message || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  const displayName = user?.displayName || (user?.isAnonymous ? "Guest" : "User");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">QuickChat</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{displayName}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Create Room */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create a Room</CardTitle>
            <CardDescription>Start a private 1:1 conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCreateRoom}
              disabled={creating}
              className="w-full gap-2"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              {creating ? "Creating..." : "Create New Room"}
            </Button>
          </CardContent>
        </Card>

        {/* Join Room */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Join a Room</CardTitle>
            <CardDescription>Enter an invite code to join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Enter invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="text-center text-lg font-mono tracking-widest"
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            />
            <Button
              onClick={handleJoinRoom}
              disabled={joining || !joinCode.trim()}
              variant="secondary"
              className="w-full gap-2"
              size="lg"
            >
              <LogIn className="h-4 w-4" />
              {joining ? "Joining..." : "Join Room"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
