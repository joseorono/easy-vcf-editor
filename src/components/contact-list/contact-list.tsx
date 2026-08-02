"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { Plus, Users } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactListFilters } from "@/components/contact-list/contact-list-filters";
import { ContactListRow } from "@/components/contact-list/contact-list-row";
import { useContacts } from "@/hooks/use-contacts";
import { useContactFilters } from "@/hooks/use-contact-filters";
import { activeContactIdAtom } from "@/state/contacts-atoms";
import { cn } from "@/lib/utils";
import type { StoredContact } from "@/types/contact-db";

interface ContactListProps {
  /** Mobile slide-in visibility. Ignored on desktop, where the rail is static. */
  isOpen: boolean;
  onClose: () => void;
  /** Desktop collapse. */
  isCollapsed: boolean;
  onSelectContact: (id: string) => void;
  onNewContact: () => void;
  onDeleteContact: (id: string) => void;
}

export function ContactList({
  isOpen,
  onClose,
  isCollapsed,
  onSelectContact,
  onNewContact,
  onDeleteContact,
}: ContactListProps) {
  const contacts = useContacts();
  const { filters, setFilters, filtered } = useContactFilters(contacts);
  const activeContactId = useAtomValue(activeContactIdAtom);
  const [deleteCandidate, setDeleteCandidate] = useState<StoredContact | null>(
    null
  );

  const handleSelect = (id: string) => {
    onSelectContact(id);
    onClose();
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate) onDeleteContact(deleteCandidate.id);
    setDeleteCandidate(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "flex h-full flex-col border-r border-border/50 bg-background",
          // Mobile: slide in from the left.
          "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out",
          isOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none lg:pointer-events-auto",
          // Desktop overrides: a static column.
          "lg:static lg:z-auto lg:w-72 lg:translate-x-0 lg:transform-none lg:transition-none xl:w-80",
          isCollapsed &&
            "lg:w-0 lg:overflow-hidden lg:border-r-0 lg:opacity-0 lg:pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h2 className="truncate font-semibold">Contacts</h2>
            {contacts && (
              <Badge variant="secondary" className="shrink-0">
                {contacts.length}
              </Badge>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onNewContact}
              className="h-8 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 lg:hidden"
            >
              Close
            </Button>
          </div>
        </div>

        <ContactListFilters filters={filters} onFiltersChange={setFilters} />

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 p-2 pb-20 lg:pb-2">
            {filtered.map((contact) => (
              <ContactListRow
                key={contact.id}
                contact={contact}
                isActive={contact.id === activeContactId}
                onSelect={() => handleSelect(contact.id)}
                onRequestDelete={() => setDeleteCandidate(contact)}
              />
            ))}

            {/* `contacts === undefined` means the first query is still in
                flight — not an empty library, so say nothing yet. */}
            {contacts && filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {filters.search.trim()
                  ? "No contacts match your search."
                  : "No contacts yet."}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteCandidate?.displayName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the contact from your library. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
