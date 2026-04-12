import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    // Only respond to direct clicks or space/enter keys
    if (
      (e.type === 'click' && (e as React.MouseEvent).button === 0) ||
      (e.type === 'keydown' && 
        ['Enter', ' '].includes((e as React.KeyboardEvent).key))
    ) {
      e.preventDefault();
      e.stopPropagation();
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleToggle}
      onKeyDown={handleToggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="flex items-center gap-2 h-9 px-3 py-2 text-sm cursor-pointer outline-none focus-visible:outline-none hover:bg-black/5 dark:hover:bg-white/5 transition-all"
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
    </Button>
  );
};

export default ThemeToggle;
