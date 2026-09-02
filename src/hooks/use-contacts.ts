import { useLiveQuery } from "dexie-react-hooks";
import { ContactDBQueries } from "@/db/queries";
import type { StoredContact } from "@/types/contact-db";

/**
 * The whole contact library, re-rendering automatically on any write.
 *
 * Returns `undefined` while the first query is in flight — that means "still
 * loading", not "no contacts", so callers must not render an empty state for it.
 */
export function useContacts(): StoredContact[] | undefined {
  return useLiveQuery(() => ContactDBQueries.getAllContacts(), []);
}
