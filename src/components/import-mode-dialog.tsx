"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ImportModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many contacts the incoming file holds. */
  contactCount: number;
  /** Name of the single incoming contact, when there is exactly one. */
  incomingName: string;
  /**
   * Whether replacing the active contact is offered. False for multi-contact
   * files, where "replace" has no sensible meaning.
   */
  canReplace: boolean;
  /**
   * How many of the incoming contacts already exist in the library. The
   * force-import button is only rendered when this is greater than zero.
   */
  duplicateCount: number;
  onAddNew: () => void;
  onReplace: () => void;
  /**
   * Fires only after the user confirms the explicit overwrite warning. The
   * parent is responsible for calling `replaceContact` for each duplicate and
   * `bulkInsertContacts` for the unique remainder.
   */
  onForceImport: () => void;
}

export function ImportModeDialog({
  open,
  onOpenChange,
  contactCount,
  incomingName,
  canReplace,
  duplicateCount,
  onAddNew,
  onReplace,
  onForceImport,
}: ImportModeDialogProps) {
  const isSingle = contactCount === 1;
  const hasDuplicates = duplicateCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSingle ? "Import contact" : `Import ${contactCount} contacts?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSingle
              ? canReplace
                ? `Add ${incomingName || "this contact"} to your library, or replace the contact you're editing?`
                : `Add ${incomingName || "this contact"} to your library.`
              : "They'll be added to your library as separate contacts."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasDuplicates && (
          <p className="text-sm text-muted-foreground">
            {duplicateCount} {duplicateCount === 1 ? "contact is" : "contacts are"} already
            in your library and won’t be imported by default.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {isSingle && canReplace && (
            <Button variant="outline" onClick={onReplace}>
              Replace current
            </Button>
          )}
          <AlertDialogAction onClick={onAddNew}>
            {isSingle ? "Add as new" : `Import ${contactCount} contacts`}
          </AlertDialogAction>

          {/*
           * Force-import requires a SEPARATE, explicit overwrite confirmation.
           * The outer AlertDialog only asks "import at all?", so a nested
           * AlertDialog gates the destructive "fully replace" action — two
           * distinct confirmations before any existing row is overwritten, per
           * the contact-import spec's "Force-import requires explicit
           * confirmation" scenario.
           */}
          {hasDuplicates && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Force import (replace {duplicateCount}{" "}
                  {duplicateCount === 1 ? "duplicate" : "duplicates"})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Replace existing contacts with incoming data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    All old fields will be lost. This cannot be undone. The
                    incoming data fully replaces the existing{" "}
                    {duplicateCount === 1 ? "contact" : "contacts"} — no fields
                    are merged.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onForceImport}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Replace and import
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}