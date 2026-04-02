import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MessageBubble from "@/components/MessageBubble";
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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Send, Copy, Users } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp | null;
}

interface RoomData {
  inviteCode: string;
  participants: string[];
  isFull: boolean;
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const msgs: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    });
    return unsubscribe;
  }, [roomId]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check access
  useEffect(() => {
    if (room && user && !room.participants.includes(user.uid)) {
      toast.error("You're not a participant");
      navigate("/");
    }
  }, [room, user, navigate]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !roomId || sending) return;
    const text = newMessage.trim();
    setNewMessage("");
    setSending(true);
    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp(),
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
          <h2 className="text-sm font-semibold text-foreground">Chat Room</h2>
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {participantCount}/2 participants
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyInviteCode}
          className="gap-1.5 text-xs text-muted-foreground"
        >
          <Copy className="h-3.5 w-3.5" />
          {room.inviteCode}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scrollbar p-4 space-y-3">
        {waitingForPartner && (
          <div className="flex justify-center py-8 animate-fade-in">
            <div className="rounded-xl bg-secondary px-4 py-3 text-center">
              <p className="text-sm text-secondary-foreground">
                Waiting for someone to join...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Share code: <span className="font-mono font-bold text-primary">{room.inviteCode}</span>
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            text={msg.text}
            senderId={msg.senderId}
            currentUserId={user.uid}
            createdAt={msg.createdAt}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1"
            disabled={waitingForPartner}
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={!newMessage.trim() || sending || waitingForPartner}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
