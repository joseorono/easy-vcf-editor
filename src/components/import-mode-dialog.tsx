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
  onAddNew: () => void;
  onReplace: () => void;
}

export function ImportModeDialog({
  open,
  onOpenChange,
  contactCount,
  incomingName,
  canReplace,
  onAddNew,
  onReplace,
}: ImportModeDialogProps) {
  const isSingle = contactCount === 1;

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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
