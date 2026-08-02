// Must come before anything that reaches the Dexie singleton.
import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import { useForm, useFieldArray } from "react-hook-form";
import { useContactAutosave } from "@/hooks/use-contact-autosave";
import { ContactDBQueries } from "@/db/queries";
import { createBlankVCardData } from "@/lib/vcf-utils";
import { AUTOSAVE_DEBOUNCE_MS } from "@/constants/contacts";
import type { VCardData } from "@/types/vcard-types";

/**
 * Mounts the autosave hook alongside a field array, mirroring the real editor —
 * `contact-form.tsx` keeps a `useFieldArray` on phones, emails, addresses and
 * more, and their re-sync behaviour is exactly what makes autosave tricky.
 */
function renderAutosave() {
  return renderHook(
    () => {
      const methods = useForm<VCardData>({
        defaultValues: createBlankVCardData(),
      });
      const phones = useFieldArray({ control: methods.control, name: "phones" });
      const autosave = useContactAutosave(methods);
      return { methods, phones, autosave };
    },
    {
      // The app runs on jotai's default store, which is module-global and would
      // otherwise carry the active contact id from one test into the next.
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(Provider, null, children),
    }
  );
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Waits out the autosave debounce on real timers.
 *
 * Vitest's fake timers can't be used here: fake-indexeddb drives its own
 * transaction processing through timers, so faking them stalls every database
 * operation the assertions are waiting on.
 */
const waitForDebounce = () =>
  new Promise((resolve) => setTimeout(resolve, AUTOSAVE_DEBOUNCE_MS + 100));

beforeEach(async () => {
  await ContactDBQueries.clearAll();
});

describe("useContactAutosave bootstrap", () => {
  it("seeds a blank contact and selects it when the library is empty", async () => {
    const { result } = renderAutosave();

    await waitFor(() =>
      expect(result.current.autosave.activeContactId).not.toBeNull()
    );
    expect(await ContactDBQueries.count()).toBe(1);
  });

  it("selects the existing contact instead of seeding another", async () => {
    const existing = await ContactDBQueries.insertContact(
      { ...createBlankVCardData(), firstName: "Jane" }
    );

    const { result } = renderAutosave();

    await waitFor(() =>
      expect(result.current.autosave.activeContactId).toBe(existing)
    );
    expect(await ContactDBQueries.count()).toBe(1);
  });
});

describe("useContactAutosave persistence", () => {
  it("saves edits to the active contact after the debounce", async () => {
    const { result } = renderAutosave();

    await waitFor(() =>
      expect(result.current.autosave.activeContactId).not.toBeNull()
    );
    const id = result.current.autosave.activeContactId!;

    act(() => {
      result.current.methods.setValue("firstName", "Jane");
    });
    await act(async () => {
      await waitForDebounce();
    });

    expect((await ContactDBQueries.getContactById(id))?.data.firstName).toBe(
      "Jane"
    );
  });

  it("persists field-array edits", async () => {
    const { result } = renderAutosave();

    await waitFor(() =>
      expect(result.current.autosave.activeContactId).not.toBeNull()
    );
    const id = result.current.autosave.activeContactId!;

    act(() => {
      result.current.phones.append({ type: "work", value: "555-4321" });
    });
    await act(async () => {
      await waitForDebounce();
    });

    const row = await ContactDBQueries.getContactById(id);
    expect(row?.data.phones.some((phone) => phone.value === "555-4321")).toBe(
      true
    );
  });

  it("writes through applyToActiveContact immediately", async () => {
    const { result } = renderAutosave();

    await waitFor(() =>
      expect(result.current.autosave.activeContactId).not.toBeNull()
    );
    const id = result.current.autosave.activeContactId!;

    await act(async () => {
      await result.current.autosave.applyToActiveContact({
        ...createBlankVCardData(),
        firstName: "Imported",
      });
    });

    expect((await ContactDBQueries.getContactById(id))?.data.firstName).toBe(
      "Imported"
    );
  });
});

describe("useContactAutosave contact loading", () => {
  it("loads the selected contact into the form", async () => {
    const other = await ContactDBQueries.insertContact({
      ...createBlankVCardData(),
      firstName: "Other",
    });
    const { result } = renderAutosave();

    await waitFor(() =>
      expect(result.current.autosave.activeContactId).not.toBeNull()
    );

    await act(async () => {
      await result.current.autosave.selectContact(other);
    });

    await waitFor(() =>
      expect(result.current.methods.getValues().firstName).toBe("Other")
    );
  });

  it("does not rewrite a contact just because it was opened", async () => {
    // The regression this guards: `reset()` makes every mounted useFieldArray
    // re-sync and emit a named change notification, which used to schedule a
    // redundant write and bump `updatedAt` — so merely viewing a contact
    // reordered the "Recently edited" list.
    const target = await ContactDBQueries.insertContact({
      ...createBlankVCardData(),
      firstName: "Untouched",
    });
    const before = (await ContactDBQueries.getContactById(target))!.updatedAt;

    const { result } = renderAutosave();
    await waitFor(() =>
      expect(result.current.autosave.activeContactId).not.toBeNull()
    );

    await act(async () => {
      await result.current.autosave.selectContact(target);
    });
    await waitFor(() =>
      expect(result.current.methods.getValues().firstName).toBe("Untouched")
    );

    // Let any echoed notification schedule and fire.
    await act(async () => {
      await waitForDebounce();
    });

    const after = (await ContactDBQueries.getContactById(target))!.updatedAt;
    expect(after.getTime()).toBe(before.getTime());
  });

  it("keeps an edit on its own contact when selection changes mid-debounce", async () => {
    const first = await ContactDBQueries.insertContact({
      ...createBlankVCardData(),
      firstName: "First",
    });
    const second = await ContactDBQueries.insertContact({
      ...createBlankVCardData(),
      firstName: "Second",
    });

    const { result } = renderAutosave();
    await waitFor(() =>
      expect(result.current.autosave.activeContactId).not.toBeNull()
    );

    await act(async () => {
      await result.current.autosave.selectContact(first);
    });
    await waitFor(() =>
      expect(result.current.methods.getValues().firstName).toBe("First")
    );

    // Type, then switch before the debounce elapses.
    act(() => {
      result.current.methods.setValue("firstName", "Edited First");
    });
    await act(async () => {
      await result.current.autosave.selectContact(second);
      await settle();
    });

    await waitFor(async () => {
      expect((await ContactDBQueries.getContactById(first))?.data.firstName).toBe(
        "Edited First"
      );
    });
    expect((await ContactDBQueries.getContactById(second))?.data.firstName).toBe(
      "Second"
    );
  });
});
