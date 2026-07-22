import { useState, useEffect } from "react";

// Matches the Tailwind `lg:` breakpoint that makes the live-preview panel
// visible on desktop. Used to decide whether to mount the (lazy) preview
// eagerly: on desktop it is always visible, on mobile it stays off-screen
// until the user opens it, so we can defer loading its chunk there.
const DESKTOP_QUERY = "(min-width: 1024px)";

export function useIsDesktop(): boolean {
  // SPA only (no SSR), so read matchMedia synchronously to avoid a flash where
  // desktop briefly renders without the preview before an effect corrects it.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(DESKTOP_QUERY);
    const handleChange = () => setIsDesktop(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}
