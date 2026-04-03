import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀","😂","🥹","😊","😍","🥰","😘","😎","🤩","🥳","😏","😢","😭","😤","🤯","🫠","😴","🤗","🫡","🤔","🙄","😬","🤭","🫣","😱","🥶","🥵","😈"],
  },
  {
    name: "Gestures",
    emojis: ["👍","👎","👏","🙌","🤝","✌️","🤞","👋","🫶","❤️","🔥","⭐","💯","✅","❌","⚡","🎉","🎊","💪","🙏","👀","💀","🫠"],
  },
  {
    name: "Objects",
    emojis: ["☕","🍕","🎮","📱","💻","🎵","🎸","⚽","🏀","🚀","✈️","🌙","☀️","🌈","🍀","🎁","💎","🔑","📸","🎬"],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiPicker = ({ onSelect }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Smile className="h-5 w-5" />
      </Button>
      {open && (
        <div className="absolute bottom-12 left-0 z-50 w-72 rounded-xl border border-border bg-card shadow-xl animate-fade-in">
          {/* Category tabs */}
          <div className="flex border-b border-border px-2 pt-2 gap-1">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveTab(i)}
                className={`px-3 py-1.5 text-xs rounded-t-lg transition-colors ${
                  activeTab === i
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {/* Emoji grid */}
          <div className="grid grid-cols-8 gap-0.5 p-2 max-h-48 overflow-y-auto chat-scrollbar">
            {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  setOpen(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-accent transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
