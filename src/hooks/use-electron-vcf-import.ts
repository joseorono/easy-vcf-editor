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
 * @param ready - Gates the `renderer-ready` handshake. The main process holds
 *   pending files until this flips true, so pass `false` while the contact
 *   library is still loading — otherwise the duplicate check in the import
 *   path runs against an empty array at cold start.
 */
export function useElectronVcfImport(
  onVcfText: (text: string) => boolean,
  ready: boolean,
): void {
  const onVcfTextRef = useRef(onVcfText);
  onVcfTextRef.current = onVcfText;

  // Subscribe once on mount, before any file can be delivered.
  useEffect(() => {
    if (!isElectron() || !window.electronAPI) return;

    if (!window.electronAPI.onOpenVcf) return;

    const unsubscribe = window.electronAPI.onOpenVcf((payload) => {
      onVcfTextRef.current(payload.content);
    });

    return unsubscribe;
  }, []);

  // Signal readiness only once the library has loaded, so pending cold-start
  // files are delivered after the duplicate check can see the real library.
  useEffect(() => {
    if (!ready) return;
    if (!isElectron() || !window.electronAPI) return;

    window.electronAPI.notifyReady?.();
  }, [ready]);
}
