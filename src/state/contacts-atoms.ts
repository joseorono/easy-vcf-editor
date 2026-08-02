import { atom } from "jotai";

/**
 * The contact currently loaded in the editor.
 *
 * Shared between the contact list (highlight + selection) and the editor
 * (which row to load and autosave into). Filter state deliberately stays local
 * to the list — it isn't shared, so it doesn't belong in an atom.
 */
export const activeContactIdAtom = atom<string | null>(null);
