import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  text: string;
  senderId: string;
  currentUserId: string;
  createdAt: Timestamp | null;
}

const MessageBubble = ({ text, senderId, currentUserId, createdAt }: MessageBubbleProps) => {
  const isSent = senderId === currentUserId;
  const time = createdAt ? format(createdAt.toDate(), "HH:mm") : "";

  return (
    <div className={cn("flex animate-fade-in", isSent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5",
          isSent
            ? "bg-chat-sent text-chat-sent-foreground rounded-br-md"
            : "bg-chat-received text-chat-received-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed break-words">{text}</p>
        {time && (
          <p
            className={cn(
              "mt-1 text-[10px]",
              isSent ? "text-chat-sent-foreground/60" : "text-muted-foreground"
            )}
          >
            {time}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
