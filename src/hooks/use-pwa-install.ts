"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface UsePwaInstallPromptResult {
  /** Whether the browser exposed the install prompt event */
  isInstallReady: boolean;
  /** Whether the user accepted the install prompt */
  hasInstalled: boolean;
  /** Trigger the install prompt if available */
  promptInstall: () => Promise<void>;
}

export function usePwaInstallPrompt(): UsePwaInstallPromptResult {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstallReady, setIsInstallReady] = useState(false);
  const [hasInstalled, setHasInstalled] = useState(false);

  const promptInstall = useCallback(async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) {
      return;
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        setHasInstalled(true);
      }

      deferredPromptRef.current = null;
      setIsInstallReady(false);
    } catch {
      setIsInstallReady(true);
    }
  }, []);

  useEffect(() => {
    const shouldAutoPrompt =
      new URLSearchParams(window.location.search).get("install") === "1";

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setIsInstallReady(true);

      if (shouldAutoPrompt) {
        void promptInstall();
      }
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setIsInstallReady(false);
      setHasInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [promptInstall]);

  return {
    isInstallReady,
    hasInstalled,
    promptInstall,
  };
}
