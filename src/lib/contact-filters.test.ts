import { describe, it, expect } from "vitest";
import { filterAndSortContacts } from "@/lib/contact-filters";
import { createBlankVCardData } from "@/lib/vcf-utils";
import { DEFAULT_CONTACT_FILTERS } from "@/constants/contacts";
import type { StoredContact } from "@/types/contact-db";
import type { VCardData } from "@/types/vcard-types";

function makeContact(
  overrides: Partial<Omit<StoredContact, "data">> & {
    data?: Partial<VCardData>;
  } = {}
): StoredContact {
  const { data: dataOverrides, ...rest } = overrides;

  return {
    id: "id-1",
    data: { ...createBlankVCardData(), ...dataOverrides },
    displayName: "Jane Doe",
    organization: "",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...rest,
  };
}

const filters = (overrides = {}) => ({ ...DEFAULT_CONTACT_FILTERS, ...overrides });

describe("filterAndSortContacts search", () => {
  it("returns everything when the search is blank", () => {
    const contacts = [makeContact({ id: "a" }), makeContact({ id: "b" })];
    expect(filterAndSortContacts(contacts, filters())).toHaveLength(2);
  });

  it("treats undefined contacts as an empty library", () => {
    expect(filterAndSortContacts(undefined, filters())).toEqual([]);
  });

  it("matches on display name, case-insensitively", () => {
    const contacts = [
      makeContact({ id: "a", displayName: "Jane Doe" }),
      makeContact({ id: "b", displayName: "John Smith" }),
    ];

    const result = filterAndSortContacts(contacts, filters({ search: "jane" }));

    expect(result.map((c) => c.id)).toEqual(["a"]);
  });

  it("matches on organization", () => {
    const contacts = [
      makeContact({ id: "a", organization: "Acme Corp" }),
      makeContact({ id: "b", organization: "Globex" }),
    ];

    const result = filterAndSortContacts(contacts, filters({ search: "acme" }));

    expect(result.map((c) => c.id)).toEqual(["a"]);
  });

  it("matches on email and phone values inside the payload", () => {
    const contacts = [
      makeContact({
        id: "a",
        data: { emails: [{ type: "work", value: "jane@acme.test" }] },
      }),
      makeContact({
        id: "b",
        data: { phones: [{ type: "cell", value: "+34600111222" }] },
      }),
      makeContact({ id: "c" }),
    ];

    expect(
      filterAndSortContacts(contacts, filters({ search: "acme.test" })).map(
        (c) => c.id
      )
    ).toEqual(["a"]);
    expect(
      filterAndSortContacts(contacts, filters({ search: "600111" })).map(
        (c) => c.id
      )
    ).toEqual(["b"]);
  });

  it("ignores surrounding whitespace in the query", () => {
    const contacts = [makeContact({ id: "a", displayName: "Jane Doe" })];

    const result = filterAndSortContacts(
      contacts,
      filters({ search: "   jane   " })
    );

    expect(result).toHaveLength(1);
  });
});

describe("filterAndSortContacts sorting", () => {
  const contacts = [
    makeContact({
      id: "a",
      displayName: "Charlie",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-03-01"),
    }),
    makeContact({
      id: "b",
      displayName: "alice",
      createdAt: new Date("2026-02-01"),
      updatedAt: new Date("2026-01-01"),
    }),
    makeContact({
      id: "c",
      displayName: "Bob",
      createdAt: new Date("2026-03-01"),
      updatedAt: new Date("2026-02-01"),
    }),
  ];

  it("sorts by name ascending, ignoring case", () => {
    const result = filterAndSortContacts(
      contacts,
      filters({ sortBy: "displayName", sortOrder: "asc" })
    );

    expect(result.map((c) => c.displayName)).toEqual([
      "alice",
      "Bob",
      "Charlie",
    ]);
  });

  it("sorts by name descending", () => {
    const result = filterAndSortContacts(
      contacts,
      filters({ sortBy: "displayName", sortOrder: "desc" })
    );

    expect(result.map((c) => c.displayName)).toEqual([
      "Charlie",
      "Bob",
      "alice",
    ]);
  });

  it("orders contacts with the same name deterministically", () => {
    const duplicates = [
      makeContact({ id: "id-b", displayName: "Sam Reyes" }),
      makeContact({ id: "id-a", displayName: "Sam Reyes" }),
    ];

    const ascending = filterAndSortContacts(
      duplicates,
      filters({ sortBy: "displayName", sortOrder: "asc" })
    );
    const reversedInput = filterAndSortContacts(
      [...duplicates].reverse(),
      filters({ sortBy: "displayName", sortOrder: "asc" })
    );

    // The id tie-break wins, so the source order Dexie happened to hand us
    // cannot leak into the result.
    expect(ascending.map((c) => c.id)).toEqual(["id-a", "id-b"]);
    expect(reversedInput.map((c) => c.id)).toEqual(["id-a", "id-b"]);
  });

  it("sorts by updatedAt, most recent first", () => {
    const result = filterAndSortContacts(
      contacts,
      filters({ sortBy: "updatedAt", sortOrder: "desc" })
    );

    expect(result.map((c) => c.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts by createdAt, oldest first", () => {
    const result = filterAndSortContacts(
      contacts,
      filters({ sortBy: "createdAt", sortOrder: "asc" })
    );

    expect(result.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("never mutates the input array", () => {
    // The input is Dexie's cached useLiveQuery array — sorting it in place
    // would corrupt state shared with every other consumer.
    const input = [...contacts];
    const originalOrder = input.map((c) => c.id);

    filterAndSortContacts(input, filters({ sortBy: "displayName", sortOrder: "asc" }));

    expect(input.map((c) => c.id)).toEqual(originalOrder);
  });

  it("returns a new array rather than the input reference", () => {
    const input = [...contacts];
    expect(filterAndSortContacts(input, filters())).not.toBe(input);
  });
});
