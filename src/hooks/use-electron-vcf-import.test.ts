import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useElectronVcfImport } from "@/hooks/use-electron-vcf-import";

type VcfOpenPayload = { name: string; content: string };
type OnOpenVcf = NonNullable<Window["electronAPI"]>["onOpenVcf"];

/**
 * Installs a controllable `onOpenVcf` bridge and captures the callback the hook
 * hands to it, so a test can fire an open-file event and observe cleanup.
 */
function installBridge() {
  let callback: ((payload: VcfOpenPayload) => void) | null = null;
  const unsubscribe = vi.fn();
  const onOpenVcf: OnOpenVcf = (cb) => {
    callback = cb;
    return unsubscribe;
  };

  window.electronAPI = {
    platform: "win32",
    isElectron: true,
    onOpenVcf,
  };

  return {
    fire: (payload: VcfOpenPayload) => callback?.(payload),
    unsubscribe,
  };
}

afterEach(() => {
  delete (window as { electronAPI?: unknown }).electronAPI;
  vi.restoreAllMocks();
});

describe("useElectronVcfImport", () => {
  it("routes delivered content into onVcfText", () => {
    const bridge = installBridge();
    const onVcfText = vi.fn(() => true);

    renderHook(() => useElectronVcfImport(onVcfText));

    const payload = {
      name: "contacts.vcf",
      content: "BEGIN:VCARD\r\nFN:Jane Doe\r\nEND:VCARD",
    };
    act(() => {
      bridge.fire(payload);
    });

    expect(onVcfText).toHaveBeenCalledTimes(1);
    expect(onVcfText).toHaveBeenCalledWith(payload.content);
  });

  it("unsubscribes on unmount", () => {
    const bridge = installBridge();
    const onVcfText = vi.fn(() => true);

    const { unmount } = renderHook(() => useElectronVcfImport(onVcfText));

    expect(bridge.unsubscribe).not.toHaveBeenCalled();
    unmount();
    expect(bridge.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("stays inert when onOpenVcf is missing", () => {
    window.electronAPI = { platform: "win32", isElectron: true };
    const onVcfText = vi.fn(() => true);

    renderHook(() => useElectronVcfImport(onVcfText));

    expect(onVcfText).not.toHaveBeenCalled();
  });

  it("stays inert outside Electron", () => {
    window.electronAPI = { platform: "web", isElectron: false };
    const onVcfText = vi.fn(() => true);

    renderHook(() => useElectronVcfImport(onVcfText));

    expect(onVcfText).not.toHaveBeenCalled();
  });
});
