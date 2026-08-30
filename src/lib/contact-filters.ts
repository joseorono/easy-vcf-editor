import type { StoredContact } from "@/types/contact-db";
import type { ContactFilters } from "@/types/contact-filters";

// Hoisted: `localeCompare` builds a collator per call, which is wasteful across
// an O(n log n) sort. `numeric` keeps "Contact 10" after "Contact 2".
const CONTACT_NAME_COLLATOR = new Intl.Collator(undefined, { numeric: true });

/**
 * Filters and sorts contacts for the contact list.
 *
 * Searching runs in memory rather than through Dexie on purpose: "contains"
 * across several fields can't use an IndexedDB index, so `Dexie.filter()` would
 * be a full cursor scan and no faster than this. Comfortable for tens or
 * hundreds of contacts; the `displayName` index and list virtualization are the
 * escape hatches if a library ever reaches thousands.
 *
 * The returned array is always a new one — `contacts` comes straight from
 * Dexie's `useLiveQuery` cache and must never be sorted in place.
 */
export function filterAndSortContacts(
  contacts: StoredContact[] | undefined,
  filters: ContactFilters
): StoredContact[] {
  const list = contacts ?? [];
  const query = filters.search.trim().toLowerCase();

  const matched = query
    ? list.filter((contact) => matchesQuery(contact, query))
    : list;

  const direction = filters.sortOrder === "asc" ? 1 : -1;

  return [...matched].sort((a, b) => {
    const comparison =
      filters.sortBy === "displayName"
        ? CONTACT_NAME_COLLATOR.compare(a.displayName, b.displayName)
        : a[filters.sortBy].getTime() - b[filters.sortBy].getTime();

    // Tie-break on id so contacts with identical names or timestamps keep a
    // stable order instead of inheriting whatever order Dexie handed us.
    return (comparison || a.id.localeCompare(b.id)) * direction;
  });
}

function matchesQuery(contact: StoredContact, query: string): boolean {
  return (
    contact.displayName.toLowerCase().includes(query) ||
    contact.organization.toLowerCase().includes(query) ||
    contact.data.emails?.some((email) =>
      email.value?.toLowerCase().includes(query)
    ) ||
    contact.data.phones?.some((phone) =>
      phone.value?.toLowerCase().includes(query)
    )
  );
}
