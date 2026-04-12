import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { X, Copy, Save } from "lucide-react";

interface ProfilePictureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfilePictureDialog = ({ open, onOpenChange }: ProfilePictureDialogProps) => {
  const { user, profile, updateProfile } = useAuth();
  const [profilePicture, setProfilePicture] = useState(profile?.photoURL || user?.photoURL || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateProfile(profile?.name || user?.displayName || "User", profilePicture.trim() || undefined);
      toast.success("Profile picture updated successfully!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update profile picture");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = () => {
    if (profilePicture) {
      navigator.clipboard.writeText(profilePicture);
      toast.success("Profile URL copied!");
    }
  };

  const handleRemove = () => {
    setProfilePicture("");
  };

  if (!user || user.isAnonymous) {
    return null; // Only show for authenticated users
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Picture</DialogTitle>
          <DialogDescription>
            Update your profile picture URL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold overflow-hidden">
              {profilePicture ? (
                <img src={profilePicture} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                (profile?.name || user?.displayName || "User").charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="profile-url">Profile Picture URL</Label>
            <div className="flex gap-2">
              <Input
                id="profile-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                className="flex-1"
              />
              {profilePicture && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  className="px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Paste an image URL from the web (GitHub, Chrome, etc.)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopyUrl}
              disabled={!profilePicture}
              className="flex-1 gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy URL
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureDialog;
