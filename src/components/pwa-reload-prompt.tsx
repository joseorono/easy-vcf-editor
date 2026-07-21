"use client";

import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { isElectron } from "@/lib/electron-detector";

export function PwaReloadPrompt() {
  // Do not run inside Electron, as the service worker is disabled there.
  if (isElectron()) {
    return null;
  }

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      console.log(`Service Worker registered at: ${swUrl}`);
    },
    onRegisterError(error) {
      console.error("Service Worker registration error:", error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success("Easy VCF Editor is ready to work offline!", {
        description: "You can access the app without an internet connection.",
        duration: 5000,
      });
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast.info("A new version of Easy VCF Editor is available!", {
        description: "Click reload to update and see the latest changes.",
        action: {
          label: "Reload",
          onClick: () => {
            void updateServiceWorker(true);
          },
        },
        duration: Infinity, // Keep toast visible until user clicks Reload
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
