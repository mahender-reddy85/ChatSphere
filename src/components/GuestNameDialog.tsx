import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom DialogContent without close button
const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <div
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

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
      <DialogContent 
        className="sm:max-w-sm mx-4 w-[calc(100vw-2rem)]" 
      >
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <UserRound className="h-5 w-5" />
            What should we call you?
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
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
            className="text-base"
          />
          <Button onClick={handleSubmit} className="w-full text-base py-3">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestNameDialog;
