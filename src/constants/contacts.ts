import type { ContactFilters } from "@/types/contact-filters";

/**
 * How long the editor waits after the last keystroke before persisting the
 * active contact. Short enough that a tab closed mid-edit loses very little,
 * long enough that typing doesn't hammer IndexedDB.
 */
export const AUTOSAVE_DEBOUNCE_MS = 500;

export const CONTACT_FALLBACK_DISPLAY_NAME = "Unnamed contact";

export const DEFAULT_CONTACT_FILTERS: ContactFilters = {
  search: "",
  sortBy: "updatedAt",
  sortOrder: "desc",
};

export const CONTACT_SORT_OPTIONS = [
  { value: "updatedAt-desc", label: "Recently edited" },
  { value: "createdAt-desc", label: "Recently added" },
  { value: "displayName-asc", label: "Name A–Z" },
  { value: "displayName-desc", label: "Name Z–A" },
] as const;
