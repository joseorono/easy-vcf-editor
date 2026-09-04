"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstallPrompt } from "@/hooks/use-pwa-install";

export function PwaInstallDialog() {
  const { isInstallReady, hasInstalled, promptInstall } =
    usePwaInstallPrompt();
  const [open, setOpen] = useState(false);
  const [installRequested, setInstallRequested] = useState(false);
  const isInstallReadyRef = useRef(isInstallReady);
  const hasInstalledRef = useRef(hasInstalled);

  isInstallReadyRef.current = isInstallReady;
  hasInstalledRef.current = hasInstalled;

  useEffect(() => {
    const requestedFromQuery =
      new URLSearchParams(window.location.search).get("install") === "1";

    if (!requestedFromQuery) {
      return;
    }

    setInstallRequested(true);

    const timeoutId = window.setTimeout(() => {
      if (!isInstallReadyRef.current && !hasInstalledRef.current) {
        setOpen(true);
      }
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (hasInstalled) {
      setOpen(false);
    }
  }, [hasInstalled]);

  useEffect(() => {
    if (installRequested && isInstallReady) {
      setOpen(true);
    }
  }, [installRequested, isInstallReady]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install Easy vCard Manager</DialogTitle>
          <DialogDescription>
            Add Easy vCard Manager to your device for quick access and offline
            use.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <MonitorDown className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            {isInstallReady
              ? "Your browser can install the app. Confirm the installation to add it to your device."
              : "Your browser does not offer the automatic install prompt here. Use the browser's menu and choose “Install app” or “Add to home screen”."}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Maybe later
          </Button>
          {isInstallReady && (
            <Button type="button" onClick={() => void promptInstall()}>
              Install app
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
