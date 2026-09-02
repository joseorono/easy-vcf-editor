import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportModeDialog } from "./import-mode-dialog";

/**
 * Presentational dialog tests — no Dexie/React-Hook-Form needed. The dialog
 * only forwards callbacks, so stubs are enough to verify the requirements:
 *
 * - The "already in your library" notice renders ONLY when
 *   `duplicateCount > 0`, with the exact count.
 * - "Force import ({m} duplicates)" button renders ONLY when
 *   `duplicateCount > 0`. The copy deliberately avoids the word "replace" —
 *   "Replace current" is a different action (it swaps the contact being
 *   edited), and the pairing of two "replace" labels was confusing.
 * - The force action is gated by a separate, nested AlertDialog carrying the
 *   explicit overwrite warning "All old fields will be lost. This cannot be
 *   undone."
 * - `onForceImport` fires ONLY after the user confirms the nested warning,
 *   never from the trigger button alone.
 */

const baseProps = {
  open: true,
  onOpenChange: () => {},
  contactCount: 2,
  incomingName: "",
  canReplace: false,
  onAddNew: () => {},
  onReplace: () => {},
  onForceImport: () => {},
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ImportModeDialog — duplicate notice", () => {
  it("does NOT render the notice when duplicateCount is 0", () => {
    render(<ImportModeDialog {...baseProps} duplicateCount={0} />);

    expect(screen.queryByText(/already in your library/i)).toBeNull();
  });

  it("renders the notice with the duplicate count when duplicateCount > 0", () => {
    render(<ImportModeDialog {...baseProps} duplicateCount={2} />);

    screen.getByText(/2 contacts are already in your library/i);
  });

  it("forwards onAddNew from the import button", async () => {
    const user = userEvent.setup();
    const onAddNew = vi.fn();
    render(
      <ImportModeDialog
        {...baseProps}
        duplicateCount={1}
        onAddNew={onAddNew}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /import 2 contacts/i }),
    );

    expect(onAddNew).toHaveBeenCalledTimes(1);
  });

  it("forwards onReplace from the replace-current button for a single contact", async () => {
    const user = userEvent.setup();
    const onReplace = vi.fn();
    render(
      <ImportModeDialog
        {...baseProps}
        contactCount={1}
        incomingName="Alice Smith"
        canReplace={true}
        duplicateCount={1}
        onReplace={onReplace}
      />,
    );

    await user.click(screen.getByRole("button", { name: /replace current/i }));

    expect(onReplace).toHaveBeenCalledTimes(1);
  });
});

describe("ImportModeDialog — force-import MUST requirements", () => {
  it("does NOT render the force-import button when duplicateCount is 0", () => {
    const onForceImport = vi.fn();
    render(
      <ImportModeDialog
        {...baseProps}
        duplicateCount={0}
        onForceImport={onForceImport}
      />,
    );

    // No force-import trigger, no explicit overwrite warning copy.
    expect(screen.queryByRole("button", { name: /force import/i })).toBeNull();
    expect(screen.queryByText(/all old fields will be lost/i)).toBeNull();
  });

  it("renders the force-import trigger with the duplicate count when duplicateCount > 0", () => {
    const onForceImport = vi.fn();
    render(
      <ImportModeDialog
        {...baseProps}
        duplicateCount={2}
        onForceImport={onForceImport}
      />,
    );

    // Throws (fails the test) when the trigger is missing. The label must
    // not contain "replace" — that word is reserved for "Replace current".
    screen.getByRole("button", { name: /force import \(2 duplicates\)/i });
  });

  it("surfaces the explicit overwrite warning in a nested AlertDialog after clicking the force trigger", async () => {
    const user = userEvent.setup();
    const onForceImport = vi.fn();
    render(
      <ImportModeDialog
        {...baseProps}
        duplicateCount={1}
        onForceImport={onForceImport}
      />,
    );

    // Warning is NOT visible before the nested confirmation is opened.
    expect(
      screen.queryByText(
        /all old fields will be lost\. this cannot be undone\./i,
      ),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: /force import \(1 duplicate\)/i }),
    );

    // Spec-mandated exact warning copy surfaces only after the trigger click.
    screen.getByText(/all old fields will be lost\. this cannot be undone\./i);
  });

  it("fires onForceImport ONLY after the user confirms the nested overwrite warning", async () => {
    const user = userEvent.setup();
    const onForceImport = vi.fn();
    render(
      <ImportModeDialog
        {...baseProps}
        duplicateCount={3}
        onForceImport={onForceImport}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /force import \(3 duplicates\)/i }),
    );

    // Pre-condition: warning is open but the user has not confirmed yet.
    expect(onForceImport).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: /overwrite and import/i }),
    );

    expect(onForceImport).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire onForceImport when the nested warning is cancelled", async () => {
    const user = userEvent.setup();
    const onForceImport = vi.fn();
    render(
      <ImportModeDialog
        {...baseProps}
        duplicateCount={1}
        onForceImport={onForceImport}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /force import \(1 duplicate\)/i }),
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onForceImport).not.toHaveBeenCalled();
  });
});
