// Must come before anything that reaches the Dexie singleton, so it binds to
// the in-memory implementation rather than a real browser database.
import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach } from "vitest";
import { ContactDBQueries } from "@/db/queries";
import { createBlankVCardData } from "@/lib/vcf-utils";
import { CONTACT_FALLBACK_DISPLAY_NAME } from "@/constants/contacts";
import type { VCardData } from "@/types/vcard-types";

function makeContact(overrides: Partial<VCardData> = {}): VCardData {
  return { ...createBlankVCardData(), ...overrides };
}

beforeEach(async () => {
  await ContactDBQueries.clearAll();
});

describe("ContactDBQueries CRUD", () => {
  it("round-trips a contact through insert and get", async () => {
    const id = await ContactDBQueries.insertContact(
      makeContact({ firstName: "Jane", lastName: "Doe" })
    );

    const row = await ContactDBQueries.getContactById(id);

    expect(row?.id).toBe(id);
    expect(row?.data.firstName).toBe("Jane");
    expect(row?.displayName).toBe("Jane Doe");
  });

  it("stores timestamps as real Date objects", async () => {
    const id = await ContactDBQueries.insertContact(makeContact());
    const row = await ContactDBQueries.getContactById(id);

    expect(row?.createdAt).toBeInstanceOf(Date);
    expect(row?.updatedAt).toBeInstanceOf(Date);
  });

  it("re-derives the index columns on update", async () => {
    const id = await ContactDBQueries.insertContact(
      makeContact({ firstName: "Jane", lastName: "Doe" })
    );

    await ContactDBQueries.updateContact(
      id,
      makeContact({ firstName: "Janet", lastName: "Roe", organization: "Acme" })
    );

    const row = await ContactDBQueries.getContactById(id);

    expect(row?.displayName).toBe("Janet Roe");
    expect(row?.organization).toBe("Acme");
  });

  it("deletes a contact", async () => {
    const id = await ContactDBQueries.insertContact(makeContact());

    await ContactDBQueries.deleteContact(id);

    expect(await ContactDBQueries.getContactById(id)).toBeUndefined();
    expect(await ContactDBQueries.count()).toBe(0);
  });

  it("returns contacts most recently updated first", async () => {
    const older = await ContactDBQueries.insertContact(
      makeContact({ firstName: "Older" })
    );
    const newer = await ContactDBQueries.insertContact(
      makeContact({ firstName: "Newer" })
    );

    // Timestamps are stamped per call, so nudge one to guarantee an ordering.
    await ContactDBQueries.updateContact(newer, makeContact({ firstName: "Newer" }));

    const rows = await ContactDBQueries.getAllContacts();

    expect(rows.map((row) => row.id)).toEqual([newer, older]);
  });
});

describe("ContactDBQueries display name derivation", () => {
  it("falls back to the nickname when there is no name", async () => {
    const id = await ContactDBQueries.insertContact(
      makeContact({ nickname: "Ziggy" })
    );

    expect((await ContactDBQueries.getContactById(id))?.displayName).toBe("Ziggy");
  });

  it("falls back to the first non-empty email", async () => {
    const id = await ContactDBQueries.insertContact(
      makeContact({
        emails: [
          { type: "home", value: "" },
          { type: "work", value: "jane@acme.test" },
        ],
      })
    );

    expect((await ContactDBQueries.getContactById(id))?.displayName).toBe(
      "jane@acme.test"
    );
  });

  it("falls back to a placeholder for a wholly blank contact", async () => {
    const id = await ContactDBQueries.insertContact(makeContact());

    expect((await ContactDBQueries.getContactById(id))?.displayName).toBe(
      CONTACT_FALLBACK_DISPLAY_NAME
    );
  });
});

describe("ContactDBQueries.bulkInsertContacts", () => {
  it("inserts every contact and returns their ids in order", async () => {
    const ids = await ContactDBQueries.bulkInsertContacts([
      makeContact({ firstName: "One" }),
      makeContact({ firstName: "Two" }),
      makeContact({ firstName: "Three" }),
    ]);

    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(await ContactDBQueries.count()).toBe(3);
    expect((await ContactDBQueries.getContactById(ids[0]))?.data.firstName).toBe(
      "One"
    );
  });
});

describe("ContactDBQueries.replaceContact", () => {
  it("overwrites the existing row under the same id without merging", async () => {
    const id = await ContactDBQueries.insertContact(
      makeContact({
        firstName: "Jane",
        lastName: "Doe",
        note: "original note",
      })
    );
    expect((await ContactDBQueries.getContactById(id))?.data.note).toBe(
      "original note"
    );

    // No `note` in the incoming payload — full replace means it is cleared.
    await ContactDBQueries.replaceContact(
      id,
      makeContact({ firstName: "Janet", lastName: "Roe" })
    );

    const after = await ContactDBQueries.getContactById(id);
    expect(after?.id).toBe(id);
    expect(after?.data.firstName).toBe("Janet");
    expect(after?.data.lastName).toBe("Roe");
    expect(after?.data.note).toBe("");
    expect(after?.displayName).toBe("Janet Roe");
  });

  it("reuses the existing id and does not create an additional row", async () => {
    const id = await ContactDBQueries.insertContact(
      makeContact({ firstName: "One" })
    );
    expect(await ContactDBQueries.count()).toBe(1);

    await ContactDBQueries.replaceContact(
      id,
      makeContact({ firstName: "Two" })
    );

    expect(await ContactDBQueries.count()).toBe(1);
    expect((await ContactDBQueries.getContactById(id))?.data.firstName).toBe(
      "Two"
    );
  });

  it("preserves createdAt and bumps updatedAt", async () => {
    const id = await ContactDBQueries.insertContact(
      makeContact({ firstName: "Old" })
    );
    const original = await ContactDBQueries.getContactById(id);
    const originalCreatedAt = original?.createdAt;
    expect(originalCreatedAt).toBeInstanceOf(Date);

    // Guarantees millisecond resolution differs between the original write
    // and the `updatedAt` stamped by replaceContact.
    await new Promise((resolve) => setTimeout(resolve, 10));

    await ContactDBQueries.replaceContact(
      id,
      makeContact({ firstName: "New" })
    );

    const after = await ContactDBQueries.getContactById(id);
    expect(after?.createdAt).toEqual(originalCreatedAt);
    expect(after?.updatedAt).toBeInstanceOf(Date);
    expect(
      (after?.updatedAt?.getTime() ?? 0) >
        (originalCreatedAt?.getTime() ?? 0)
    ).toBe(true);
  });

  it("re-derives the denormalized index columns", async () => {
    const id = await ContactDBQueries.insertContact(
      makeContact({ firstName: "Jane", lastName: "Doe", organization: "Acme" })
    );

    await ContactDBQueries.replaceContact(
      id,
      makeContact({ firstName: "Janet", lastName: "Roe", organization: "Globex" })
    );

    const after = await ContactDBQueries.getContactById(id);
    expect(after?.displayName).toBe("Janet Roe");
    expect(after?.organization).toBe("Globex");
  });

  it("no-ops silently when the target id was already deleted", async () => {
    const id = await ContactDBQueries.insertContact(
      makeContact({ firstName: "One" })
    );
    await ContactDBQueries.deleteContact(id);

    await expect(
      ContactDBQueries.replaceContact(id, makeContact({ firstName: "Two" }))
    ).resolves.toBeUndefined();
    expect(await ContactDBQueries.count()).toBe(0);
  });
});

describe("ContactDBQueries.ensureSeedContact", () => {
  it("creates a blank contact when the library is empty", async () => {
    const id = await ContactDBQueries.ensureSeedContact();

    expect(await ContactDBQueries.count()).toBe(1);
    expect((await ContactDBQueries.getContactById(id))?.id).toBe(id);
  });

  it("returns the existing contact instead of adding another", async () => {
    const existing = await ContactDBQueries.insertContact(
      makeContact({ firstName: "Jane" })
    );

    expect(await ContactDBQueries.ensureSeedContact()).toBe(existing);
    expect(await ContactDBQueries.count()).toBe(1);
  });

  it("stays at one contact under concurrent calls", async () => {
    // React StrictMode runs mount effects twice in development, so this is the
    // real scenario the transaction exists to survive.
    const [first, second] = await Promise.all([
      ContactDBQueries.ensureSeedContact(),
      ContactDBQueries.ensureSeedContact(),
    ]);

    expect(first).toBe(second);
    expect(await ContactDBQueries.count()).toBe(1);
  });
});
