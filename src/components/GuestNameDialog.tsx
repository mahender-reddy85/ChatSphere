import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserRound } from "lucide-react";

interface GuestNameDialogProps {
  open: boolean;
  onSubmit: (name: string) => void;
}

const GuestNameDialog = ({ open, onSubmit }: GuestNameDialogProps) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim() || "Guest";
    onSubmit(trimmed);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            What should we call you?
          </DialogTitle>
          <DialogDescription>
            Enter a display name for your chat profile
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={20}
            autoFocus
          />
          <Button onClick={handleSubmit} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestNameDialog;
