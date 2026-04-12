import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { QrCode, Download, Share2 } from "lucide-react";

interface QRCodeDialogProps {
  inviteCode: string;
  inviteLink: string;
  children?: React.ReactNode;
}

const QRCodeDialog = ({ inviteCode, inviteLink, children }: QRCodeDialogProps) => {
  const [open, setOpen] = useState(false);

  const downloadQR = () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `chatsphere-${inviteCode}.png`;
      link.href = url;
      link.click();
    }
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my ChatSphere room",
          text: `Join my chat room with code: ${inviteCode}`,
          url: inviteLink,
        });
      } catch {
        console.log("Share cancelled or failed");
      }
    } else {
      navigator.clipboard.writeText(inviteLink);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" title="Show QR Code">
            <QrCode className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Room</DialogTitle>
          <DialogDescription>
            Scan this QR code or share the invite link to join this chat room
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <QRCodeDisplay value={inviteLink} size={200} />
          
          <div className="text-center space-y-2">
            <div className="font-mono text-lg font-bold text-primary">
              {inviteCode}
            </div>
            <p className="text-sm text-muted-foreground">
              Room Code
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={downloadQR} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={shareQR} variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDialog;
