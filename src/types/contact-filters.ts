export type ContactSortBy = "updatedAt" | "createdAt" | "displayName";

export type SortOrder = "asc" | "desc";

export interface ContactFilters {
  search: string;
  sortBy: ContactSortBy;
  sortOrder: SortOrder;
}
