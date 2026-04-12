import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  User,
  Settings,
  Share,
  Copy,
  LogOut,
  Save,
  Mail,
} from "lucide-react";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfilePictureClick: () => void;
}

const ProfileSettingsDialog = ({ open, onOpenChange, onProfilePictureClick }: ProfileSettingsDialogProps) => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [username, setUsername] = useState(profile?.name || "");
  const displayName = profile?.name || user?.displayName || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  const profilePicture = profile?.photoURL || user?.photoURL || defaultAvatar;
  const [enterToSend, setEnterToSend] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("enterToSend") !== "false";
    }
    return true;
  });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user || !username.trim()) return;
    
    setSaving(true);
    try {
      await updateProfile(username.trim(), profilePicture.trim() || undefined);
      toast.success("Profile updated successfully!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleEnterToSendToggle = () => {
    const newValue = !enterToSend;
    setEnterToSend(newValue);
    localStorage.setItem("enterToSend", newValue.toString());
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}?ref=${user?.uid?.slice(-8) || "17"}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  const handleShareInvite = async () => {
    const inviteLink = `${window.location.origin}?ref=${user?.uid?.slice(-8) || "17"}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ChatSphere",
          text: "Join me on ChatSphere for private conversations!",
          url: inviteLink,
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      handleCopyInviteLink();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onOpenChange(false);
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const inviteLink = `${window.location.origin}?ref=${user?.uid?.slice(-8) || "17"}`;

  if (!user || user.isAnonymous) {
    return null; // Only show for authenticated users
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Profile Menu</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <h3 className="text-sm font-medium">Profile</h3>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                   onClick={onProfilePictureClick}>
                {profilePicture ? (
                  <img src={profilePicture} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  avatarLetter
                )}
              </div>
              <div className="flex-1">
                <div>
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user?.email || "No email"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                maxLength={20}
              />
            </div>
          </div>

          <Separator />

          {/* Chat Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h3 className="text-sm font-medium">Chat Settings</h3>
            </div>

            <div className="space-y-4">
              {/* Enter to Send */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enter to Send</p>
                  <p className="text-xs text-muted-foreground">
                    Press Enter to send messages
                  </p>
                </div>
                <Switch checked={enterToSend} onCheckedChange={handleEnterToSendToggle} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Invite Friends Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              <h3 className="text-sm font-medium">Invite Friends</h3>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Share this link to invite others to the app!
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyInviteLink}
                  className="gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareInvite}
                  className="gap-1"
                >
                  <Share className="h-3 w-3" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveProfile}
              disabled={saving || !username.trim()}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1 gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettingsDialog;
