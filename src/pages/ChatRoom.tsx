import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import useNotificationSound from "@/hooks/useNotificationSound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import EmojiPicker from "@/components/EmojiPicker";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  getDocs,
  Timestamp,
  writeBatch,
  arrayRemove,
} from "firebase/firestore";
import { ref, set, onValue } from "firebase/database";
import { db, rtdb, isFirebaseConfigured } from "@/lib/firebase";
import { ArrowLeft, Send, Copy, Link, Users, Circle, Timer, Shield, DoorOpen } from "lucide-react";
import { MessageStatus } from "@/components/MessageBubble";

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  text: string;
  createdAt: Timestamp | null;
  status: MessageStatus;
}

interface RoomData {
  inviteCode: string;
  participants: string[];
  isFull: boolean;
  chatMode?: "permanent" | "temporary";
  autoDeleteMinutes?: number;
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const playSound = useNotificationSound();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const prevMsgCountRef = useRef(0);

  const otherUid = room?.participants.find((p) => p !== user?.uid);
  const otherPresence = usePresence(otherUid);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Listen to room data
  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = onSnapshot(doc(db, "rooms", roomId), (snapshot) => {
      if (snapshot.exists()) {
        setRoom(snapshot.data() as RoomData);
      } else {
        toast.error("Room not found");
        navigate("/");
      }
    });
    return unsubscribe;
  }, [roomId, navigate]);

  // Listen to messages
  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((d) => ({
        id: d.id,
        status: "sent" as MessageStatus,
        ...d.data(),
      })) as Message[];
      
      // Play sound for new incoming messages
      if (msgs.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.senderId !== user?.uid) {
          playSound();
        }
      }
      prevMsgCountRef.current = msgs.length;
      setMessages(msgs);
    });
    return unsubscribe;
  }, [roomId, user?.uid, playSound]);

  // Mark messages as seen + update lastReadAt
  useEffect(() => {
    if (!roomId || !user || !messages.length) return;
    const unseenFromOther = messages.filter(
      (m) => m.senderId !== user.uid && m.status !== "seen"
    );
    if (unseenFromOther.length > 0) {
      const batch = writeBatch(db);
      unseenFromOther.forEach((m) => {
        batch.update(doc(db, "rooms", roomId, "messages", m.id), { status: "seen" });
      });
      batch.commit().catch(() => {});
    }
    // Update lastReadAt for this user
    updateDoc(doc(db, "rooms", roomId), {
      [`lastReadAt.${user.uid}`]: serverTimestamp(),
    }).catch(() => {});
  }, [messages, roomId, user]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherTyping]);

  // Check access
  useEffect(() => {
    if (room && user && !room.participants.includes(user.uid)) {
      toast.error("You're not a participant");
      navigate("/");
    }
  }, [room, user, navigate]);

  // Listen to typing indicator
  useEffect(() => {
    if (!roomId || !otherUid || !isFirebaseConfigured()) return;
    try {
      const typingRef = ref(rtdb, `typing/${roomId}/${otherUid}`);
      const unsubscribe = onValue(typingRef, (snapshot) => {
        if (snapshot.exists()) {
          setOtherTyping(snapshot.val().isTyping === true);
        } else {
          setOtherTyping(false);
        }
      });
      return () => unsubscribe();
    } catch {}
  }, [roomId, otherUid]);

  // Set typing status
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId || !user || !isFirebaseConfigured()) return;
      try {
        set(ref(rtdb, `typing/${roomId}/${user.uid}`), { isTyping });
      } catch {}
    },
    [roomId, user]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !roomId || sending) return;
    const text = newMessage.trim();
    setNewMessage("");
    setTyping(false);
    setSending(true);
    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        senderId: user.uid,
        senderName: profile?.name || user.displayName || "Guest",
        senderPhoto: profile?.photoURL || user.photoURL || "",
        text,
        createdAt: serverTimestamp(),
        status: "sent" as MessageStatus,
      });
      await updateDoc(doc(db, "rooms", roomId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast.error("Failed to send message");
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const copyInviteCode = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode);
      toast.success("Invite code copied!");
    }
  };

  const copyInviteLink = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(`${window.location.origin}/join/${room.inviteCode}`);
      toast.success("Invite link copied!");
    }
  };

  if (!room || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.2s]" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  const participantCount = room.participants.length;
  const waitingForPartner = participantCount < 2;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Chat Room</h2>
            {room.chatMode === "temporary" && (
              <Timer className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {otherUid && (
              <div className="flex items-center gap-1">
                <Circle
                  className={cn(
                    "h-2 w-2",
                    otherPresence.isOnline ? "fill-online text-online" : "fill-offline text-offline"
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {otherPresence.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            )}
            {!otherUid && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{participantCount}/2</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={copyInviteLink} title="Copy invite link">
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyInviteCode}
            className="gap-1.5 text-xs text-muted-foreground font-mono"
          >
            <Copy className="h-3.5 w-3.5" />
            {room.inviteCode}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scrollbar p-4 space-y-3">
        {waitingForPartner && (
          <div className="flex justify-center py-8 animate-fade-in">
            <div className="rounded-xl bg-secondary px-4 py-3 text-center">
              <p className="text-sm text-secondary-foreground">Waiting for someone to join...</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Share code: <span className="font-mono font-bold text-primary">{room.inviteCode}</span>
              </p>
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={copyInviteLink}>
                <Link className="h-3 w-3" />
                Copy invite link
              </Button>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            text={msg.text}
            senderId={msg.senderId}
            currentUserId={user.uid}
            senderName={msg.senderName}
            senderPhoto={msg.senderPhoto}
            createdAt={msg.createdAt}
            status={msg.status}
            showStatus={true}
          />
        ))}
        <TypingIndicator visible={otherTyping} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <EmojiPicker onSelect={(emoji) => setNewMessage((prev) => prev + emoji)} />
          <Input
            placeholder={waitingForPartner ? "Waiting for partner..." : "Type a message..."}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1"
            disabled={waitingForPartner}
          />
          <Button onClick={handleSend} size="icon" disabled={!newMessage.trim() || sending || waitingForPartner}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default ChatRoom;
