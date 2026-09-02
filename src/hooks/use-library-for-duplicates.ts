import { useCallback } from "react";
import { isElectron } from "@/lib/electron-detector";
import { ContactDBQueries } from "@/db/queries";
import type { StoredContact } from "@/types/contact-db";

/**
 * Returns a function that fetches the current contact library for duplicate
 * detection. In Electron, always queries the DB fresh to avoid stale LiveQuery
 * data during rapid imports. In web, uses the provided LiveQuery snapshot.
 *
 * @param liveQueryLibrary - The library from useContacts (LiveQuery). Used in web.
 * @returns A function that returns the current library (sync in web, async in Electron).
 */
export function useLibraryForDuplicates(
  liveQueryLibrary: StoredContact[] | undefined,
): {
  getLibrary: () => Promise<StoredContact[]>;
  getLibrarySync: () => StoredContact[];
} {
  const inElectron = isElectron();

  const getLibrary = useCallback(async (): Promise<StoredContact[]> => {
    // In Electron, always fetch fresh from DB to avoid stale LiveQuery data
    // during rapid imports (e.g., multiple files via second-instance).
    if (inElectron) {
      return ContactDBQueries.getAllContacts();
    }
    // In web, use the LiveQuery snapshot. If still loading, fall back to fresh query.
    return liveQueryLibrary ?? (await ContactDBQueries.getAllContacts());
  }, [inElectron, liveQueryLibrary]);

  const getLibrarySync = useCallback((): StoredContact[] => {
    // Sync version for use in render-time duplicate count calculations.
    // In web, use LiveQuery. In Electron, return empty array as a signal
    // that the caller should use the async version instead.
    if (inElectron) {
      return [];
    }
    return liveQueryLibrary ?? [];
  }, [inElectron, liveQueryLibrary]);

  return { getLibrary, getLibrarySync };
}
