import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileSettingsDialog from "@/components/ProfileSettingsDialog";
import ProfilePictureDialog from "@/components/ProfilePictureDialog";
import QRCodeDialog from "@/components/QRCodeDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  runTransaction,
  doc,
  onSnapshot,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  LogIn,
  LogOut,
  Clock,
  Shield,
  Timer,
  ChevronRight,
  Settings,
  QrCode,
} from "lucide-react";

import { generateInviteCode, createRoom, joinRoomByInviteCode } from "@/lib/room";

interface RoomListItem {
  id: string;
  inviteCode: string;
  participants: string[];
  lastMessage: string | null;
  updatedAt: Timestamp;
  chatMode?: "permanent" | "temporary";
  lastReadAt?: Record<string, Timestamp>;
}

const Home = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [chatMode, setChatMode] = useState<"permanent" | "temporary">("permanent");
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [profilePictureOpen, setProfilePictureOpen] = useState(false);

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


  // Compute unread counts from room metadata — zero extra Firestore reads
  // Uses updatedAt vs lastReadAt already present in the room snapshot
  const unreadCounts = useMemo(() => {
    if (!user) return {};
    const counts: Record<string, number> = {};
    rooms.forEach((room) => {
      const lastRead = room.lastReadAt?.[user.uid];
      const lastReadMs = lastRead?.toMillis?.() ?? 0;
      const updatedMs = room.updatedAt?.toMillis?.() ?? 0;
      // Show badge if room was updated after we last read it
      counts[room.id] = (updatedMs > lastReadMs) ? 1 : 0;
    });
    return counts;
  }, [rooms, user]);

  const handleCreateRoom = async () => {
    if (!user) return;
    setCreating(true);
    
    try {
      const { id, inviteCode } = await createRoom(user.uid, chatMode);
      
      toast.success("Room created!", {
        description: `Invite code: ${inviteCode}`,
        action: {
          label: "Copy",
          onClick: () => navigator.clipboard.writeText(inviteCode),
        },
      });
      
      navigate(`/chat/${id}`);
    } catch (error: any) {
      console.error("Room creation error:", error);
      
      if (error.message?.includes('quota')) {
        toast.error("Service temporarily unavailable. Please try again in a few minutes.");
      } else if (error.message?.includes('permission')) {
        toast.error("Permission denied. Please check your account.");
      } else {
        toast.error("Failed to create room. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    try {
      const roomId = await joinRoomByInviteCode(user.uid, joinCode);
      navigate(`/chat/${roomId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  const displayName = profile?.name || user?.displayName || (user?.isAnonymous ? "Guest" : "User");
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 pt-8">
      <div className="w-full max-w-md space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">ChatSphere</h1>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-80 transition-opacity"
                  >
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      avatarLetter
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
                  {/* User Details Section */}
                  <div className="px-2 py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfilePictureOpen(true);
                        }}>
                        {profile?.photoURL ? (
                          <img src={profile.photoURL} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          avatarLetter
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <p className="font-medium text-sm truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email || (user?.isAnonymous ? "Guest" : "No email")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Icons section */}
                  <div className="px-2 py-2">
                    <div className="flex items-center justify-center gap-2">
                      {user?.isAnonymous ? (
                        <>
                          <DropdownMenuItem 
                            className="p-2 cursor-pointer" 
                            onSelect={(e) => e.preventDefault()}
                            asChild
                          >
                            <ThemeToggle />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={signOut} className="p-2 cursor-pointer">
                            <LogOut className="h-4 w-4" />
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => setProfileSettingsOpen(true)} className="p-2 cursor-pointer">
                            <Settings className="h-4 w-4" />
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="p-2 cursor-pointer" 
                            onSelect={(e) => e.preventDefault()}
                            asChild
                          >
                            <ThemeToggle />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={signOut} className="p-2 cursor-pointer">
                            <LogOut className="h-4 w-4" />
                          </DropdownMenuItem>
                        </>
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <ThemeToggle />
                <Button
                  onClick={() => navigate('/auth')}
                  size="sm"
                  className="px-1.5"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Create Room */}
        <Card>
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-lg">Create a Room</CardTitle>
            <CardDescription>Start a private 1:1 conversation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <Button
                  variant={chatMode === "permanent" ? "default" : "outline"}
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => setChatMode("permanent")}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Permanent
                </Button>
              </div>
              <div className="flex-1 space-y-2">
                <Button
                  variant={chatMode === "temporary" ? "default" : "outline"}
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => setChatMode("temporary")}
                >
                  <Timer className="h-3.5 w-3.5" />
                  Temporary
                </Button>
                {chatMode === "temporary" && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center animate-in fade-in slide-in-from-top-1">
                    Messages auto-delete after 30 minutes
                  </p>
                )}
              </div>
            </div>
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
          <CardHeader className="pb-3 text-center">
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
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Chats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-accent">
                  <button
                    onClick={() => navigate(`/chat/${room.id}`)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <div className="h-4 w-4 rounded-full bg-primary"></div>
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
                    <div className="flex flex-col items-end gap-1">
                      {unreadCounts[room.id] > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {unreadCounts[room.id]}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </button>
                  <QRCodeDialog 
                    inviteCode={room.inviteCode}
                    inviteLink={`${window.location.origin}/join/${room.inviteCode}`}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </QRCodeDialog>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Profile Settings Dialog */}
      <ProfileSettingsDialog 
        open={profileSettingsOpen} 
        onOpenChange={setProfileSettingsOpen} 
        onProfilePictureClick={() => setProfilePictureOpen(true)}
      />
      
      {/* Profile Picture Dialog */}
      <ProfilePictureDialog 
        open={profilePictureOpen} 
        onOpenChange={setProfilePictureOpen} 
      />
    </div>
  );
};

export default Home;
