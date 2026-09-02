import { describe, it, expect } from "vitest";
import {
  findDuplicates,
  normalizeEmail,
} from "@/lib/duplicate-detection";
import { createBlankVCardData } from "@/lib/vcf-utils";
import type { VCardData } from "@/types/vcard-types";
import type { StoredContact } from "@/types/contact-db";

/**
 * Builds a `VCardData` from partial overrides — defaults come from a fresh
 * blank card so every test starts from a known-good shape (arrays present,
 * strings empty), and the contact-as-stored layer never has to react to
 * `undefined`.
 */
function makeIncoming(overrides: Partial<VCardData> = {}): VCardData {
  return { ...createBlankVCardData(), ...overrides };
}

function email(value: string): { type: "home"; value: string } {
  return { type: "home", value };
}

function phone(value: string): { type: "cell"; value: string } {
  return { type: "cell", value };
}

/** Builds a `StoredContact` with sensible defaults for matcher tests. */
function makeExisting(
  overrides: Partial<StoredContact> & { id: string }
): StoredContact {
  const createdAt = overrides.createdAt ?? new Date("2020-01-01T00:00:00.000Z");
  return {
    id: overrides.id,
    data: overrides.data ?? makeIncoming(),
    displayName: overrides.displayName ?? "",
    organization: overrides.organization ?? "",
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
  };
}

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases the local and domain parts", () => {
    expect(normalizeEmail("  Alice@Example.COM ")).toBe("alice@example.com");
  });

  it("strips a leading mailto: prefix (case-insensitive)", () => {
    expect(normalizeEmail("MAILTO:alice@example.com")).toBe("alice@example.com");
    expect(normalizeEmail("mailto:bob@example.test")).toBe("bob@example.test");
  });

  it("returns an empty string for empty or whitespace-only input", () => {
    expect(normalizeEmail("")).toBe("");
    expect(normalizeEmail("   ")).toBe("");
  });
});

describe("findDuplicates — Duplicate Matching Criteria", () => {
  it("flags a shared email as a duplicate referencing the existing contact", () => {
    const incoming = makeIncoming({
      emails: [email("alice@example.com")],
    });
    const existing = makeExisting({
      id: "ex-1",
      data: makeIncoming({
        firstName: "Alice",
        emails: [email("alice@example.com")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.unique).toEqual([]);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.existingId).toBe("ex-1");
  });

  it("flags shared firstName + lastName + shared phone as a duplicate", () => {
    const incoming = makeIncoming({
      firstName: "Alice",
      lastName: "Smith",
      phones: [phone("+15551234")],
    });
    const existing = makeExisting({
      id: "ex-2",
      data: makeIncoming({
        firstName: "Alice",
        lastName: "Smith",
        phones: [phone("+15551234")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.unique).toEqual([]);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.existingId).toBe("ex-2");
  });

  it("does NOT flag shared name when no shared phone exists", () => {
    const incoming = makeIncoming({
      firstName: "Alice",
      lastName: "Smith",
      phones: [phone("+1999999")],
    });
    const existing = makeExisting({
      id: "ex-3",
      data: makeIncoming({
        firstName: "Alice",
        lastName: "Smith",
        phones: [phone("+15551234")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toEqual([]);
    expect(result.unique).toEqual([incoming]);
  });

  it("does NOT flag shared name when the incoming contact has no phone", () => {
    const incoming = makeIncoming({ firstName: "Alice", lastName: "Smith" });
    const existing = makeExisting({
      id: "ex-3b",
      data: makeIncoming({
        firstName: "Alice",
        lastName: "Smith",
        phones: [phone("+15551234")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toEqual([]);
    expect(result.unique).toEqual([incoming]);
  });

  it("does not throw when emails, phones, firstName, or lastName are absent or empty", () => {
    const incoming = makeIncoming({ firstName: "", lastName: "" });
    const existing = makeExisting({
      id: "ex-4",
      data: makeIncoming({ firstName: "", lastName: "" }),
    });

    expect(() => findDuplicates([incoming], [existing])).not.toThrow();
    expect(findDuplicates([incoming], [existing]).duplicates).toEqual([]);
  });

  it("does not throw when the existing row has no emails and incoming has no phones", () => {
    const incoming = makeIncoming({
      firstName: "Alice",
      lastName: "Smith",
    });
    const existing = makeExisting({
      id: "ex-5",
      data: makeIncoming({
        firstName: "Alice",
        lastName: "Smith",
        emails: [],
        phones: [],
      }),
    });

    expect(() => findDuplicates([incoming], [existing])).not.toThrow();
    // No shared email, no phone on existing → name+phone rule cannot match.
    expect(findDuplicates([incoming], [existing]).duplicates).toEqual([]);
  });
});

describe("findDuplicates — Comparator Normalization", () => {
  it("flags duplicate when existing email differs only by case and a mailto: prefix", () => {
    const incoming = makeIncoming({
      emails: [email("mailto:alice@example.com")],
    });
    const existing = makeExisting({
      id: "ex-6",
      data: makeIncoming({
        emails: [email("Alice@Example.com")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.existingId).toBe("ex-6");
  });

  it("flags duplicate when phones differ only by common formatting characters", () => {
    const incoming = makeIncoming({
      firstName: "Alice",
      lastName: "Smith",
      phones: [phone("+15551234")],
    });
    const existing = makeExisting({
      id: "ex-7",
      data: makeIncoming({
        firstName: "Alice",
        lastName: "Smith",
        phones: [phone("+1 555-1234")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.existingId).toBe("ex-7");
  });

  it("compares names case-insensitively and trims surrounding whitespace", () => {
    const incoming = makeIncoming({
      firstName: "  alice  ",
      lastName: "SMITH",
      phones: [phone("+15551234")],
    });
    const existing = makeExisting({
      id: "ex-7b",
      data: makeIncoming({
        firstName: "Alice",
        lastName: " Smith ",
        phones: [phone("+15551234")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.existingId).toBe("ex-7b");
  });
});

describe("findDuplicates — Pure and Side-Effect Free", () => {
  it("returns a { unique, duplicates } result without doing any I/O", () => {
    const incoming = [makeIncoming({ emails: [email("alice@example.com")] })];
    const existing = [
      makeExisting({
        id: "ex-8",
        data: makeIncoming({ emails: [email("alice@example.com")] }),
      }),
    ];

    // No throws, sensible shape — and no Dexie/React import touched at module
    // load (the test file only imports the matcher + vcf-utils for fixtures).
    const result = findDuplicates(incoming, existing);

    expect(result).toHaveProperty("unique");
    expect(result).toHaveProperty("duplicates");
    expect(Array.isArray(result.unique)).toBe(true);
    expect(Array.isArray(result.duplicates)).toBe(true);
  });

  it("references the first existing contact it matched against (first wins)", () => {
    const incoming = makeIncoming({ emails: [email("shared@example.com")] });
    const older = makeExisting({
      id: "older",
      data: makeIncoming({ emails: [email("shared@example.com")] }),
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    const newer = makeExisting({
      id: "newer",
      data: makeIncoming({ emails: [email("shared@example.com")] }),
      createdAt: new Date("2021-06-01T00:00:00.000Z"),
    });

    const result = findDuplicates([incoming], [newer, older]);

    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.existingId).toBe("older");
  });

  it("breaks createdAt ties via id asc", () => {
    const incoming = makeIncoming({ emails: [email("shared@example.com")] });
    const tiedStamp = new Date("2020-01-01T00:00:00.000Z");
    const b = makeExisting({
      id: "b",
      data: makeIncoming({ emails: [email("shared@example.com")] }),
      createdAt: tiedStamp,
    });
    const a = makeExisting({
      id: "a",
      data: makeIncoming({ emails: [email("shared@example.com")] }),
      createdAt: tiedStamp,
    });

    const result = findDuplicates([incoming], [b, a]);

    expect(result.duplicates[0]?.existingId).toBe("a");
  });

  it("does not mutate its inputs (purity)", () => {
    const incoming = [
      makeIncoming({
        firstName: "Alice",
        lastName: "Smith",
        emails: [email("alice@example.com")],
        phones: [phone("+15551234")],
      }),
      makeIncoming({ firstName: "Bob", lastName: "Brown" }),
    ];
    const existing = [
      makeExisting({
        id: "ex-9",
        data: makeIncoming({
          firstName: "Alice",
          lastName: "Smith",
          emails: [email("mailto:ALICE@Example.com")],
          phones: [phone("+1 555-1234")],
        }),
      }),
    ];

    const incomingSnapshot = structuredClone(incoming);
    const existingSnapshot = structuredClone(existing);

    findDuplicates(incoming, existing);

    expect(incoming).toEqual(incomingSnapshot);
    expect(existing).toEqual(existingSnapshot);
    // Guard against accidental reordering of the caller's array reference.
    expect(existing.map((row) => row.id)).toEqual(existingSnapshot.map((row) => row.id));
  });

  it("does not cross-compare the incoming batch against itself (intra-file independence)", () => {
    // Two incoming contacts share an email that is NOT in the library — both
    // must be classified as unique, even though they duplicate each other.
    const a = makeIncoming({
      firstName: "Alice",
      emails: [email("new@example.com")],
    });
    const b = makeIncoming({
      firstName: "Alicia",
      emails: [email("new@example.com")],
    });
    const existing = [
      makeExisting({ id: "ex-10", data: makeIncoming({ emails: [] }) }),
    ];

    const result = findDuplicates([a, b], existing);

    expect(result.unique).toEqual([a, b]);
    expect(result.duplicates).toEqual([]);
  });
});

describe("findDuplicates — full-name matching (single-part names)", () => {
  it("flags a single-part name (no lastName) + shared phone as a duplicate", () => {
    const incoming = makeIncoming({
      firstName: "Juan",
      phones: [phone("+5491122334455")],
    });
    const existing = makeExisting({
      id: "ex-11",
      data: makeIncoming({
        firstName: "Juan",
        phones: [phone("+5491122334455")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.unique).toEqual([]);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.existingId).toBe("ex-11");
  });

  it("does NOT flag a single-part name when the phones differ", () => {
    const incoming = makeIncoming({
      firstName: "Juan",
      phones: [phone("+5491111000000")],
    });
    const existing = makeExisting({
      id: "ex-12",
      data: makeIncoming({
        firstName: "Juan",
        phones: [phone("+5491122334455")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toEqual([]);
    expect(result.unique).toEqual([incoming]);
  });

  it("does NOT flag an empty name even when the phone is shared", () => {
    const incoming = makeIncoming({ phones: [phone("+5491122334455")] });
    const existing = makeExisting({
      id: "ex-13",
      data: makeIncoming({ phones: [phone("+5491122334455")] }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toEqual([]);
    expect(result.unique).toEqual([incoming]);
  });

  it("matches the same full name split differently between FN/N exports", () => {
    // An FN-only export ("Alice Smith" lands entirely in firstName) vs a
    // structured N: with given/family split — same person, same phone.
    const incoming = makeIncoming({
      firstName: "Alice Smith",
      phones: [phone("+15551234")],
    });
    const existing = makeExisting({
      id: "ex-14",
      data: makeIncoming({
        firstName: "Alice",
        lastName: "Smith",
        phones: [phone("+15551234")],
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.existingId).toBe("ex-14");
  });
});

describe("findDuplicates — UID matching", () => {
  it("flags a shared non-empty uid even with no other field in common", () => {
    const incoming = makeIncoming({
      uid: "urn:uuid:8e0d9f9a-2f6c-4c9a-9b1d-1e2f3a4b5c6d",
      firstName: "Alice",
    });
    const existing = makeExisting({
      id: "ex-15",
      data: makeIncoming({
        uid: "urn:uuid:8e0d9f9a-2f6c-4c9a-9b1d-1e2f3a4b5c6d",
        firstName: "Alicia",
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.existingId).toBe("ex-15");
  });

  it("does not flag when only one side carries a uid", () => {
    const incoming = makeIncoming({
      uid: "urn:uuid:8e0d9f9a-2f6c-4c9a-9b1d-1e2f3a4b5c6d",
      firstName: "Alice",
    });
    const existing = makeExisting({
      id: "ex-16",
      data: makeIncoming({ firstName: "Alice" }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toEqual([]);
    expect(result.unique).toEqual([incoming]);
  });

  it("does not flag different uids", () => {
    const incoming = makeIncoming({
      uid: "urn:uuid:aaaaaaaa-0000-0000-0000-000000000001",
    });
    const existing = makeExisting({
      id: "ex-17",
      data: makeIncoming({
        uid: "urn:uuid:aaaaaaaa-0000-0000-0000-000000000002",
      }),
    });

    const result = findDuplicates([incoming], [existing]);

    expect(result.duplicates).toEqual([]);
    expect(result.unique).toEqual([incoming]);
  });
});
