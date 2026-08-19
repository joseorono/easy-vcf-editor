// Must come before anything that reaches the Dexie singleton.
import "fake-indexeddb/auto";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { ThemeProvider } from "@/components/theme-provider";
import { VcfEditor } from "@/components/vcf-editor";
import { ContactDBQueries } from "@/db/queries";

type VcfOpenPayload = { name: string; content: string };
type OnOpenVcf = NonNullable<Window["electronAPI"]>["onOpenVcf"];

const SINGLE_CONTACT_VCF =
  "BEGIN:VCARD\r\nVERSION:4.0\r\nFN:Alice Smith\r\nN:Smith;Alice;;;\r\nEND:VCARD";

const TWO_CONTACT_VCF =
  "BEGIN:VCARD\r\nVERSION:4.0\r\nFN:Alice Smith\r\nN:Smith;Alice;;;\r\nEND:VCARD\r\n" +
  "BEGIN:VCARD\r\nVERSION:4.0\r\nFN:Bob Jones\r\nN:Jones;Bob;;;\r\nEND:VCARD";

// jsdom has no matchMedia; `useIsDesktop` and next-themes both call it.
function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Installs the Electron open-file bridge and captures the callback the hook
 * hands it, so a test can fire an OS "open file" event.
 */
function installOpenVcfBridge() {
  let callback: ((payload: VcfOpenPayload) => void) | null = null;
  const onOpenVcf: OnOpenVcf = (cb) => {
    callback = cb;
    return () => {};
  };
  window.electronAPI = { platform: "win32", isElectron: true, onOpenVcf };
  return { fire: (payload: VcfOpenPayload) => callback?.(payload) };
}

function renderEditor() {
  return render(
    <Provider>
      <ThemeProvider>
        <VcfEditor />
      </ThemeProvider>
    </Provider>
  );
}

beforeEach(async () => {
  stubMatchMedia();
  await ContactDBQueries.clearAll();
});

afterEach(() => {
  delete (window as { electronAPI?: unknown }).electronAPI;
  vi.restoreAllMocks();
});

describe("VcfEditor — Electron file-association import seam", () => {
  it("imports a single-contact file opened from the OS", async () => {
    const bridge = installOpenVcfBridge();
    renderEditor();

    act(() => {
      bridge.fire({ name: "alice.vcf", content: SINGLE_CONTACT_VCF });
    });

    // The single-card branch in `handleIncomingVcfText` surfaces a success
    // toast, proving the delivered content reached the shared import seam.
    await screen.findByText(/successfully imported alice smith/i);
  });

  it("imports a multi-contact batch through the add-new path", async () => {
    const bridge = installOpenVcfBridge();
    const bulkInsert = vi
      .spyOn(ContactDBQueries, "bulkInsertContacts")
      .mockResolvedValue(["id-alice", "id-bob"]);
    const user = userEvent.setup();

    renderEditor();

    act(() => {
      bridge.fire({ name: "batch.vcf", content: TWO_CONTACT_VCF });
    });

    // Multi-contact opens land in `setPendingImport`, which opens the mode
    // dialog instead of importing straight away.
    await user.click(
      await screen.findByRole("button", { name: /import 2 contacts/i })
    );

    await waitFor(() => {
      expect(bulkInsert).toHaveBeenCalledTimes(1);
      expect(bulkInsert.mock.calls[0][0]).toHaveLength(2);
    });
  });
});
