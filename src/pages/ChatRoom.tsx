import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import useNotificationSound from "@/hooks/useNotificationSound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import ThemeToggle from "@/components/ThemeToggle";
import QRCodeDialog from "@/components/QRCodeDialog";
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
  getDoc,
  Timestamp,
  writeBatch,
  arrayRemove,
} from "firebase/firestore";
import { ref, set, onValue } from "firebase/database";
import { db, rtdb, isFirebaseConfigured } from "@/lib/firebase";
import { ArrowLeft, Send, Copy, Link, Users, Circle, Timer, Shield, DoorOpen, Settings, QrCode, Trash2, ArrowUp, Volume2, VolumeX, Smartphone, ArrowUpDown } from "lucide-react";
import { MessageStatus } from "@/components/MessageBubble";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { Switch } from "@/components/ui/switch";

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
  chatMode?: "permanent" | "temporary";
  autoDeleteMinutes?: number;
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, profile } = useAuth();
  const { soundEnabled, setSoundEnabled, vibrationEnabled, setVibrationEnabled, autoScroll, setAutoScroll } = useSettings();
  const navigate = useNavigate();
  const playSound = useNotificationSound();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [messageVisibility, setMessageVisibility] = useState<Record<string, { showAvatar: boolean; showName: boolean }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const prevMsgCountRef = useRef(0);
  const lastSendTimeRef = useRef(0);
  const sendCountRef = useRef(0);

  const MAX_MESSAGE_LENGTH = 1000;
  const RATE_LIMIT_WINDOW = 3000; // 3 seconds
  const RATE_LIMIT_MAX = 5; // max 5 messages per window

  const otherUid = room?.participants.find((p) => p !== user?.uid);
  const otherPresence = usePresence(otherUid);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Show/hide scroll to top button based on scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setShowScrollTop(scrollTop > 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        const msgData = { id: doc.id, ...data } as Message;
        
        // Update visibility tracking for new messages
        if (!messageVisibility[msgData.senderId]) {
          setMessageVisibility(prev => ({
            ...prev,
            [msgData.senderId]: { showAvatar: true, showName: true }
          }));
        }
        
        return msgData;
      });
      
      // Play notification for new messages (not sent by current user)
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderId !== user?.uid) {
        playSound();
      }
      
      prevMsgCountRef.current = msgs.length;
      setMessages(msgs);
    });
    return unsubscribe;
  }, [roomId, user?.uid, playSound, messageVisibility]);

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
    } catch (error) {
      console.error('Failed to set up typing listener:', error);
    }
  }, [roomId, otherUid]);

  // Set typing status
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId || !user || !isFirebaseConfigured()) return;
      try {
        set(ref(rtdb, `typing/${roomId}/${user.uid}`), { isTyping });
      } catch (error) {
        console.error('Failed to set typing status:', error);
      }
    },
    [roomId, user]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > MAX_MESSAGE_LENGTH) return;
    setNewMessage(value);
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !roomId || sending) return;
    
    const text = newMessage.trim();
    if (text.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message too long (max ${MAX_MESSAGE_LENGTH} chars)`);
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastSendTimeRef.current < RATE_LIMIT_WINDOW) {
      sendCountRef.current++;
      if (sendCountRef.current > RATE_LIMIT_MAX) {
        toast.error("Slow down! Too many messages.");
        return;
      }
    } else {
      sendCountRef.current = 1;
      lastSendTimeRef.current = now;
    }

    // Clear input immediately to prevent duplicate sends
    const messageToSend = text;
    setNewMessage("");
    setTyping(false);
    setSending(true);
    
    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        senderId: user.uid,
        senderName: profile?.name || user.displayName || "Guest",
        senderPhoto: profile?.photoURL || user.photoURL || "",
        text: messageToSend,
        createdAt: serverTimestamp(),
        status: "sent" as MessageStatus,
      });
      await updateDoc(doc(db, "rooms", roomId), {
        lastMessage: messageToSend,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      // Restore message only if send failed
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId || !user || !room) {
      toast.error("Room not found or invalid state");
      return;
    }
    
    const confirmed = window.confirm(
      "Are you sure you want to delete this room? This action cannot be undone and will remove all messages."
    );
    
    if (!confirmed) return;
    
    try {
      // First check if room exists
      const roomRef = doc(db, "rooms", roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        toast.error("Room not found");
        navigate("/");
        return;
      }
      
      const messagesSnap = await getDocs(collection(db, "rooms", roomId, "messages"));
      
      if (messagesSnap.empty) {
        // If no messages, just delete the room
        await deleteDoc(roomRef);
        toast.success("Room deleted successfully");
        navigate("/");
        return;
      }
      
      // Check batch size limits (Firestore max 500 operations per batch)
      const batchSize = 400;
      const totalMessages = messagesSnap.docs.length;
      
      if (totalMessages <= batchSize) {
        // Delete in single batch
        const batch = writeBatch(db);
        messagesSnap.docs.forEach((d) => batch.delete(d.ref));
        batch.delete(roomRef);
        await batch.commit();
        toast.success("Room deleted successfully");
        navigate("/");
      } else {
        // Delete in multiple batches
        for (let i = 0; i < messagesSnap.docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchMessages = messagesSnap.docs.slice(i, i + batchSize);
          
          batchMessages.forEach((d) => batch.delete(d.ref));
          
          // Delete room in the last batch
          if (i + batchSize >= messagesSnap.docs.length) {
            batch.delete(roomRef);
          }
          
          await batch.commit();
          
          // Small delay between batches to avoid quota issues
          if (i + batchSize < messagesSnap.docs.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        toast.success("Room deleted successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to delete room:", error);
      
      // Provide specific error messages
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. You may not have rights to delete this room.");
      } else if (error.code === 'not-found') {
        toast.error("Room not found or has already been deleted.");
      } else if (error.message?.includes('quota')) {
        toast.error("Service temporarily unavailable. Please try again later.");
      } else if (error.message?.includes('network')) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to delete room. Please try again.");
      }
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !user || !room) return;
    try {
      const roomRef = doc(db, "rooms", roomId);
      const newParticipants = room.participants.filter((p) => p !== user.uid);
      if (newParticipants.length === 0) {
        // Delete all messages then delete room
        const messagesSnap = await getDocs(collection(db, "rooms", roomId, "messages"));
        const batch = writeBatch(db);
        messagesSnap.docs.forEach((d) => batch.delete(d.ref));
        batch.delete(roomRef);
        await batch.commit();
        toast.success("Room deleted");
      } else {
        await updateDoc(roomRef, {
          participants: arrayRemove(user.uid),
          updatedAt: serverTimestamp(),
        });
        toast.success("Left room");
      }
      navigate("/");
    } catch {
      toast.error("Failed to leave room");
    }
  };

  const handleClearChat = async () => {
    if (!roomId) {
      toast.error("Cannot clear chat: Room not found");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear all messages in this chat? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      const messagesQuery = query(collection(db, "rooms", roomId, "messages"));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      if (messagesSnapshot.empty) {
        toast.info("No messages to clear");
        return;
      }

      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      toast.success("Chat cleared successfully");
    } catch (error) {
      console.error("Failed to clear chat:", error);
      toast.error("Failed to clear chat");
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
    <div className="flex h-screen max-h-screen flex-col mobile-full-height">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card px-4 py-3 mobile-safe-area">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Room Code:</h2>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {room.inviteCode}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={copyInviteCode}
                className="h-6 w-6 hover:bg-primary/20"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
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
        
        {/* Theme toggle and settings */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mobile-touch-target">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="w-56 sm:w-64">
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <span className="text-sm">Sound</span>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm">Vibration</span>
                </div>
                <Switch
                  checked={vibrationEnabled}
                  onCheckedChange={setVibrationEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="text-sm">Auto-scroll</span>
                </div>
                <Switch
                  checked={autoScroll}
                  onCheckedChange={setAutoScroll}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
            <DropdownMenuItem onClick={copyInviteLink} className="gap-3 p-3 sm:p-2">
              <Link className="h-4 w-4 shrink-0" />
              <span className="text-sm">Invite Link</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearChat} className="gap-3 p-3 sm:p-2">
              <Trash2 className="h-4 w-4 shrink-0" />
              <span className="text-sm">Clear Chat</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteRoom} 
              className="gap-3 p-3 sm:p-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span className="text-sm">Delete Room</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLeaveRoom} 
              className="gap-3 p-3 sm:p-2 text-destructive focus:text-destructive"
            >
              <DoorOpen className="h-4 w-4 shrink-0" />
              <span className="text-sm">Leave Room</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto chat-scrollbar mobile-scroll mobile-hide-scrollbar p-4 space-y-3 relative"
      >
        {waitingForPartner && (
          <div className="flex justify-center py-8 animate-fade-in">
            <div className="rounded-xl bg-secondary px-4 py-3 text-center">
              <p className="text-sm text-secondary-foreground">Waiting for someone to join...</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Share code: <span className="font-mono font-bold text-primary">{room.inviteCode}</span>
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-xs mobile-touch-target h-6 px-2" 
                  onClick={copyInviteCode}
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="flex gap-2 justify-center mt-3">
                <Button variant="ghost" size="sm" className="gap-1 text-xs mobile-touch-target" onClick={copyInviteLink}>
                  <Link className="h-3 w-3" />
                  Copy invite link
                </Button>
                <QRCodeDialog 
                  inviteCode={room.inviteCode}
                  inviteLink={`${window.location.origin}/join/${room.inviteCode}`}
                >
                  <Button variant="ghost" size="sm" className="gap-1 text-xs mobile-touch-target">
                    <QrCode className="h-3 w-3" />
                    Show QR
                  </Button>
                </QRCodeDialog>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg, index) => {
          const visibility = messageVisibility[msg.senderId] || { showAvatar: true, showName: true };
          const isFirstFromSender = index === 0 || messages[index - 1]?.senderId !== msg.senderId;
          
          return (
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
              showAvatar={isFirstFromSender ? visibility.showAvatar : false}
              showName={isFirstFromSender ? visibility.showName : false}
            />
          );
        })}
        <TypingIndicator visible={otherTyping} />
        <div ref={messagesEndRef} />
        
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 z-10 rounded-full shadow-lg mobile-touch-target bg-primary text-primary-foreground hover:bg-primary/90"
            size="icon"
            title="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3 sm:p-4 mobile-no-zoom mobile-safe-area">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Input
              placeholder={waitingForPartner ? "Waiting for partner..." : "Type a message..."}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                // Mobile: ensure input is properly focused
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
              }}
              disabled={waitingForPartner}
              maxLength={MAX_MESSAGE_LENGTH}
              className="text-base sm:text-sm mobile-no-zoom focus:outline-none"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {newMessage.length > MAX_MESSAGE_LENGTH * 0.8 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {newMessage.length}/{MAX_MESSAGE_LENGTH}
              </span>
            )}
          </div>
          <Button onClick={handleSend} size="icon" disabled={!newMessage.trim() || sending || waitingForPartner} className="mobile-touch-target">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
