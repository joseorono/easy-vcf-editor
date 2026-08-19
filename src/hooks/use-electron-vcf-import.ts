import { useEffect, useRef } from "react";
import { isElectron } from "@/lib/electron-detector";

/**
 * Subscribes to Electron file-association opens and routes the delivered vCard
 * text into the shared import handler (`handleIncomingVcfText`), reusing the
 * existing parse/dedup/duplicate-warning flow.
 *
 * Inert in the web/PWA build: it returns early unless the app is running under
 * Electron with the `onOpenVcf` preload bridge available.
 *
 * The handler is read through a ref so the subscription is made once on mount
 * and always calls the latest handler, without re-subscribing on every render.
 *
 * @param onVcfText - Receives the vCard text of each opened file. Its return
 *   value is ignored; success/error toasts are handled inside the import path.
 */
export function useElectronVcfImport(
  onVcfText: (text: string) => boolean
): void {
  const onVcfTextRef = useRef(onVcfText);
  onVcfTextRef.current = onVcfText;

  useEffect(() => {
    if (!isElectron() || !window.electronAPI?.onOpenVcf) return;

    const unsubscribe = window.electronAPI.onOpenVcf((payload) => {
      onVcfTextRef.current(payload.content);
    });

    return unsubscribe;
  }, []);
}
