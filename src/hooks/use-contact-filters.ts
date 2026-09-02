import { useState } from "react";
import { DEFAULT_CONTACT_FILTERS } from "@/constants/contacts";
import { filterAndSortContacts } from "@/lib/contact-filters";
import type { StoredContact } from "@/types/contact-db";
import type { ContactFilters } from "@/types/contact-filters";

interface UseContactFiltersResult {
  filters: ContactFilters;
  setFilters: (filters: ContactFilters) => void;
  filtered: StoredContact[];
}

/**
 * Search and sort state for the contact list, plus the filtered result.
 *
 * The filtering itself lives in `filterAndSortContacts` so it stays testable
 * without React or IndexedDB. No memoization here by design — the React
 * Compiler handles it.
 */
export function useContactFilters(
  contacts: StoredContact[] | undefined
): UseContactFiltersResult {
  const [filters, setFilters] = useState<ContactFilters>(
    DEFAULT_CONTACT_FILTERS
  );

  return {
    filters,
    setFilters,
    filtered: filterAndSortContacts(contacts, filters),
  };
}
