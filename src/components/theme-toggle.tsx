import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative inline-flex h-8 w-14 items-center rounded-full border border-border/60 bg-muted/60 px-1 text-foreground transition-colors duration-200 hover:bg-muted"
      aria-label="Toggle theme"
    >
      {/* Icons at the ends */}
      <span className="pointer-events-none flex w-full items-center justify-between">
        <Sun
          className={`h-3.5 w-3.5 transition-colors duration-200 ${
            isDark ? "text-yellow-300" : "text-yellow-500"
          }`}
        />
        <Moon
          className={`h-3.5 w-3.5 transition-colors duration-200 ${
            isDark ? "text-sky-300" : "text-slate-500"
          }`}
        />
      </span>

      {/* Sliding thumb */}
      <span
        className={`pointer-events-none absolute left-1 top-1 h-6 w-6 rounded-full bg-background shadow-sm transition-transform duration-200 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      />

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
