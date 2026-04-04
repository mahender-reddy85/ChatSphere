import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

export type MessageStatus = "sent" | "delivered" | "seen";

interface MessageBubbleProps {
  text: string;
  senderId: string;
  currentUserId: string;
  senderName?: string;
  senderPhoto?: string;
  createdAt: Timestamp | null;
  status?: MessageStatus;
  showStatus?: boolean;
}

const StatusIcon = ({ status }: { status: MessageStatus }) => {
  switch (status) {
    case "sent":
      return <Check className="h-3 w-3" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3" />;
    case "seen":
      return <CheckCheck className="h-3 w-3 text-primary" />;
  }
};

const MessageBubble = ({
  text,
  senderId,
  currentUserId,
  senderName,
  senderPhoto,
  createdAt,
  status = "sent",
  showStatus = false,
}: MessageBubbleProps) => {
  const isSent = senderId === currentUserId;
  const time = createdAt ? format(createdAt.toDate(), "HH:mm") : "";

  const avatarUrl = senderPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(senderName || "U")}`;

  return (
    <div className={cn("flex animate-fade-in gap-2", isSent ? "justify-end" : "justify-start")}>
      {!isSent && (
        <img
          src={avatarUrl}
          alt={senderName || "User"}
          className="h-7 w-7 rounded-full shrink-0 mt-1"
        />
      )}
      <div>
        {!isSent && senderName && (
          <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{senderName}</p>
        )}
        <div
          className={cn(
            "max-w-[75%] rounded-2xl px-4 py-2.5",
            isSent
              ? "bg-chat-sent text-chat-sent-foreground rounded-br-md"
              : "bg-chat-received text-chat-received-foreground rounded-bl-md"
          )}
        >
          <p className="text-sm leading-relaxed break-words">{text}</p>
          <div className={cn("mt-1 flex items-center gap-1", isSent ? "justify-end" : "justify-start")}>
            {time && (
              <span className={cn("text-[10px]", isSent ? "text-chat-sent-foreground/60" : "text-muted-foreground")}>
                {time}
              </span>
            )}
            {isSent && showStatus && (
              <span className="text-chat-sent-foreground/60">
                <StatusIcon status={status} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
