"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_SORT_OPTIONS } from "@/constants/contacts";
import type {
  ContactFilters,
  ContactSortBy,
  SortOrder,
} from "@/types/contact-filters";

interface ContactListFiltersProps {
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
}

export function ContactListFilters({
  filters,
  onFiltersChange,
}: ContactListFiltersProps) {
  const sortValue = `${filters.sortBy}-${filters.sortOrder}`;

  const handleSortChange = (value: string) => {
    // Split at the last dash — sort fields never contain one, so this stays
    // unambiguous.
    const separatorIndex = value.lastIndexOf("-");
    onFiltersChange({
      ...filters,
      sortBy: value.slice(0, separatorIndex) as ContactSortBy,
      sortOrder: value.slice(separatorIndex + 1) as SortOrder,
    });
  };

  return (
    <div className="flex flex-col gap-2 border-b border-border/50 px-3 pb-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value })
          }
          placeholder="Search contacts…"
          aria-label="Search contacts"
          className="h-9 pl-8"
        />
      </div>

      <Select value={sortValue} onValueChange={handleSortChange}>
        <SelectTrigger aria-label="Sort contacts" className="h-9 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONTACT_SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
