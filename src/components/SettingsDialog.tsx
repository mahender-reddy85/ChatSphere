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
import { Volume2, VolumeX, Vibrate, Smartphone, ArrowUpDown, Trash2 } from "lucide-react";
import { collection, getDocs, writeBatch, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId?: string;
}

const SettingsDialog = ({ open, onOpenChange, roomId }: SettingsDialogProps) => {
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

        // Delete all messages in a batch
        const batch = writeBatch(db);
        messagesSnap.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        toast.success(`Cleared ${messagesSnap.docs.length} messages`);
        onOpenChange(false);
        
        // Trigger a page reload to refresh the chat
        window.location.reload();
      } catch (error) {
        console.error("Failed to clear chat:", error);
        toast.error("Failed to clear chat");
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
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound">Sound</Label>
                <p className="text-xs text-muted-foreground">
                  Play sound for new messages
                </p>
              </div>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vibration">Vibration</Label>
                <p className="text-xs text-muted-foreground">
                  Vibrate on new messages (mobile)
                </p>
              </div>
              <Switch
                id="vibration"
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
              />
            </div>
          </div>

          {/* Chat Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Chat Behavior
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoscroll">Auto-scroll</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically scroll to new messages
                </p>
              </div>
              <Switch
                id="autoscroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
            </div>
          </div>

          {/* Clear Chat Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Clear Chat
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Clear Messages</Label>
                <p className="text-xs text-muted-foreground">
                  Delete all messages in this chat
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearChat}
                className="px-3"
              >
                Clear
              </Button>
            </div>
          </div>
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
