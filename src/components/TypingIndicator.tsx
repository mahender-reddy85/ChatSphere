import { cn } from "@/lib/utils";

const TypingIndicator = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="rounded-2xl rounded-bl-md bg-chat-received px-4 py-3">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-dot" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-dot [animation-delay:0.2s]" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-dot [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
