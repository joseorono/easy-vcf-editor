import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

type VcfOpenPayload = { name: string; content: string };

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
  /**
   * Subscribes to file-association opens. The main process delivers each opened
   * `.vcf`/`.vcard` file (name + vCard text) over the `vcf:open` channel.
   * Returns an unsubscribe function so the renderer can clean up on unmount.
   */
  onOpenVcf: (
    callback: (payload: VcfOpenPayload) => void
  ): (() => void) => {
    const listener = (_event: IpcRendererEvent, payload: VcfOpenPayload) => {
      callback(payload);
    };
    ipcRenderer.on("vcf:open", listener);
    return () => {
      ipcRenderer.removeListener("vcf:open", listener);
    };
  },
});
