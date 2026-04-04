import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
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
  serverTimestamp,
  runTransaction,
  doc,
  onSnapshot,
  orderBy,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  LogIn,
  LogOut,
  MessageSquare,
  Clock,
  Shield,
  Timer,
  User,
  ChevronRight,
} from "lucide-react";

const generateInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

interface RoomListItem {
  id: string;
  inviteCode: string;
  participants: string[];
  isFull: boolean;
  lastMessage: string | null;
  updatedAt: any;
  chatMode?: "permanent" | "temporary";
  unreadCount?: number;
}

const Home = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [chatMode, setChatMode] = useState<"permanent" | "temporary">("permanent");
  const [showProfile, setShowProfile] = useState(false);

  // Load user's rooms
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "rooms"),
      where("participants", "array-contains", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList: RoomListItem[] = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as RoomListItem))
        .sort((a, b) => {
          const aTime = a.updatedAt?.seconds || 0;
          const bTime = b.updatedAt?.seconds || 0;
          return bTime - aTime;
        });
      setRooms(roomList);
    });
    return unsubscribe;
  }, [user]);

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
        chatMode,
        autoDeleteMinutes: chatMode === "temporary" ? 30 : null,
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

      if (roomData.participants.includes(user.uid)) {
        navigate(`/chat/${roomDoc.id}`);
        return;
      }

      if (roomData.isFull || roomData.participants.length >= 2) {
        toast.error("Room is full");
        setJoining(false);
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
    } catch (error: any) {
      toast.error(error.message || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  const displayName = user?.displayName || (user?.isAnonymous ? "Guest" : "User");
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pt-8">
      <div className="w-full max-w-md space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">ChatSphere</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                avatarLetter
              )}
            </button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Profile card */}
        {showProfile && (
          <Card className="animate-fade-in">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-12 w-12 rounded-full" />
                ) : (
                  avatarLetter
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || (user?.isAnonymous ? "Anonymous Guest" : "No email")}
                </p>
                <p className="text-xs text-muted-foreground">
                  UID: {user?.uid?.slice(0, 8)}...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Room */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create a Room</CardTitle>
            <CardDescription>Start a private 1:1 conversation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={chatMode === "permanent" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => setChatMode("permanent")}
              >
                <Shield className="h-3.5 w-3.5" />
                Permanent
              </Button>
              <Button
                variant={chatMode === "temporary" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => setChatMode("temporary")}
              >
                <Timer className="h-3.5 w-3.5" />
                Temporary
              </Button>
            </div>
            {chatMode === "temporary" && (
              <p className="text-xs text-muted-foreground">
                Messages auto-delete after 30 minutes
              </p>
            )}
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

        {/* Recent Chats */}
        {rooms.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Chats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => navigate(`/chat/${room.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <MessageSquare className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground font-mono">
                        {room.inviteCode}
                      </span>
                      {room.chatMode === "temporary" && (
                        <Timer className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {room.participants.length}/2
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {room.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Home;
