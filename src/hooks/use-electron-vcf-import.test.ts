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
  const notifyReady = vi.fn();
  const onOpenVcf: OnOpenVcf = (cb) => {
    callback = cb;
    return unsubscribe;
  };

  window.electronAPI = {
    platform: "win32",
    isElectron: true,
    onOpenVcf,
    notifyReady,
  };

  return {
    fire: (payload: VcfOpenPayload) => callback?.(payload),
    unsubscribe,
    notifyReady,
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

    // `ready: false` proves routing works regardless of the handshake —
    // main.ts can deliver directly (e.g. the 5s fallback) before the library
    // has loaded.
    renderHook(() => useElectronVcfImport(onVcfText, false));

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

    const { unmount } = renderHook(() =>
      useElectronVcfImport(onVcfText, false),
    );

    expect(bridge.unsubscribe).not.toHaveBeenCalled();
    unmount();
    expect(bridge.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("stays inert when onOpenVcf is missing", () => {
    window.electronAPI = { platform: "win32", isElectron: true };
    const onVcfText = vi.fn(() => true);

    renderHook(() => useElectronVcfImport(onVcfText, true));

    expect(onVcfText).not.toHaveBeenCalled();
  });

  it("stays inert outside Electron", () => {
    window.electronAPI = { platform: "web", isElectron: false };
    const onVcfText = vi.fn(() => true);

    renderHook(() => useElectronVcfImport(onVcfText, true));

    expect(onVcfText).not.toHaveBeenCalled();
  });

  it("does not signal renderer-ready while ready is false", () => {
    const bridge = installBridge();
    const onVcfText = vi.fn(() => true);

    renderHook(() => useElectronVcfImport(onVcfText, false));

    // The subscription is live, but the handshake that flushes pending
    // cold-start files must NOT fire before the library has loaded —
    // otherwise the duplicate check runs against an empty array.
    expect(bridge.notifyReady).not.toHaveBeenCalled();
  });

  it("signals renderer-ready once ready is true at mount", () => {
    const bridge = installBridge();
    const onVcfText = vi.fn(() => true);

    renderHook(() => useElectronVcfImport(onVcfText, true));

    expect(bridge.notifyReady).toHaveBeenCalledTimes(1);
  });

  it("signals renderer-ready when ready flips to true after mount (cold start)", () => {
    const bridge = installBridge();
    const onVcfText = vi.fn(() => true);

    const { rerender } = renderHook(
      ({ ready }: { ready: boolean }) => useElectronVcfImport(onVcfText, ready),
      { initialProps: { ready: false } },
    );

    expect(bridge.notifyReady).not.toHaveBeenCalled();

    rerender({ ready: true });

    expect(bridge.notifyReady).toHaveBeenCalledTimes(1);

    // Re-rendering with ready unchanged must not re-fire the handshake.
    rerender({ ready: true });
    expect(bridge.notifyReady).toHaveBeenCalledTimes(1);
  });
});
