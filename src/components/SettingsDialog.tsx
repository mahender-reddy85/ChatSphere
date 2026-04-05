import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/contexts/SettingsContext";
import { Volume2, VolumeX, Vibrate, Smartphone, ArrowUpDown, Trash2, Copy } from "lucide-react";
import { collection, getDocs, writeBatch, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId?: string;
  roomData?: any;
}

const SettingsDialog = ({ open, onOpenChange, roomId, roomData }: SettingsDialogProps) => {
  const { 
    soundEnabled, 
    setSoundEnabled, 
    vibrationEnabled, 
    setVibrationEnabled,
    autoScroll,
    setAutoScroll
  } = useSettings();

  const handleClearChat = async () => {
    if (!roomId) {
      toast.error("Cannot clear chat: Room not found");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear all messages in this chat? This action cannot be undone."
    );
    
    if (confirmed) {
      try {
        // Get all messages in the room
        const messagesRef = collection(db, "rooms", roomId, "messages");
        const messagesSnap = await getDocs(messagesRef);
        
        if (messagesSnap.empty) {
          toast.info("No messages to clear");
          return;
        }

        const totalMessages = messagesSnap.docs.length;
        let clearedCount = 0;
        
        // Process messages in smaller batches to avoid quota limits
        const batchSize = 400; // Firestore limit is 500 operations per batch
        for (let i = 0; i < messagesSnap.docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchMessages = messagesSnap.docs.slice(i, i + batchSize);
          
          batchMessages.forEach((doc) => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
          clearedCount += batchMessages.length;
          
          // Show progress for large clears
          if (totalMessages > 500) {
            toast.info(`Cleared ${clearedCount}/${totalMessages} messages...`);
          }
          
          // Small delay between batches to avoid rate limiting
          if (i + batchSize < messagesSnap.docs.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        toast.success(`Cleared all ${totalMessages} messages`);
        onOpenChange(false);
        
        // Trigger a page reload to refresh the chat
        window.location.reload();
      } catch (error) {
        console.error("Failed to clear chat:", error);
        
        if (error.message?.includes('quota')) {
          toast.error("Too many messages to clear at once. Please try again later.");
        } else {
          toast.error("Failed to clear chat");
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Chat Settings
          </DialogTitle>
          <DialogDescription>
            Customize your chat experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Sound Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              Notifications
            </h3>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 mr-4">
                <Label htmlFor="sound" className="text-sm font-medium">Sound</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Play sound for new messages
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="sound"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 mr-4">
                <Label htmlFor="vibration" className="text-sm font-medium">Vibration</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Vibrate on new messages (mobile)
                </p>
              </div>
              <Switch
                id="vibration"
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {/* Chat Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Chat Behavior
            </h3>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 mr-4">
                <Label htmlFor="autoscroll" className="text-sm font-medium">Auto-scroll</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically scroll to new messages
                </p>
              </div>
              <Switch
                id="autoscroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {/* Room Info Section */}
          {roomId && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Room Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1 mr-4">
                    <Label className="text-sm font-medium">Room Code</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Share this code to invite others
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {roomData?.inviteCode || 'Loading...'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (roomData?.inviteCode) {
                          navigator.clipboard.writeText(roomData.inviteCode);
                          toast.success("Room code copied!");
                        }
                      }}
                      className="px-2 py-1"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clear Chat Section */}
          {roomId && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Clear Chat
              </h3>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex-1 mr-4">
                  <Label className="text-sm font-medium">Clear Messages</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delete all messages in this chat
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearChat}
                  className="px-4 py-2"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
