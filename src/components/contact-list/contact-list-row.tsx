"use client";

import { Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buildInitials } from "@/lib/vcf-utils";
import { cn } from "@/lib/utils";
import type { StoredContact } from "@/types/contact-db";

interface ContactListRowProps {
  contact: StoredContact;
  isActive: boolean;
  onSelect: () => void;
  onRequestDelete: () => void;
}

export function ContactListRow({
  contact,
  isActive,
  onSelect,
  onRequestDelete,
}: ContactListRowProps) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-md py-2 pl-2 pr-8 transition-colors",
        isActive ? "bg-accent" : "hover:bg-muted/60"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar className="h-9 w-9 shrink-0">
          {contact.data.photo && (
            <AvatarImage src={contact.data.photo} alt="" />
          )}
          <AvatarFallback className="text-xs">
            {buildInitials(contact.data)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{contact.displayName}</p>
          {contact.organization && (
            <p className="truncate text-xs text-muted-foreground">
              {contact.organization}
            </p>
          )}
        </div>
      </button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRequestDelete}
        aria-label={`Delete ${contact.displayName}`}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
