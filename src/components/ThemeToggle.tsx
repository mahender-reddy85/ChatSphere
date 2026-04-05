import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

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
      size="icon"
      onClick={handleToggle}
      onKeyDown={handleToggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="cursor-pointer focus:ring-2 focus:ring-ring focus:ring-offset-2"
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

export default ThemeToggle;
