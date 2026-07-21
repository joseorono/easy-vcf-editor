import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Reserve the footprint before hydration so the navbar doesn't shift.
  if (!mounted)
    return <span className="h-8 w-14 shrink-0" aria-hidden="true" />;

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-8 w-14 rounded-full border border-border/60 bg-muted/60 p-0 hover:bg-muted"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {/* Track markers: the destination the thumb is not currently sitting on. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-between px-2"
      >
        <Sun
          className={`size-3 transition-opacity duration-300 ease-out ${
            isDark ? "opacity-40" : "opacity-0"
          }`}
        />
        <Moon
          className={`size-3 transition-opacity duration-300 ease-out ${
            isDark ? "opacity-0" : "opacity-40"
          }`}
        />
      </span>

      {/* Sliding thumb, carrying the active icon. */}
      <span
        className={`pointer-events-none absolute left-1 top-1 flex size-6 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-300 ease-out ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        <Sun
          className={`absolute size-3.5 text-amber-500 transition-all duration-300 ease-out ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          className={`absolute size-3.5 text-sky-400 transition-all duration-300 ease-out ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </span>
    </Button>
  );
}
