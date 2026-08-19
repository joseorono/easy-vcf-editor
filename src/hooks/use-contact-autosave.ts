import { useEffect, useRef } from "react";
import { useAtom, useStore } from "jotai";
import type { UseFormReturn } from "react-hook-form";
import { AUTOSAVE_DEBOUNCE_MS } from "@/constants/contacts";
import { ContactDBQueries } from "@/db/queries";
import { activeContactIdAtom } from "@/state/contacts-atoms";
import type { VCardData } from "@/types/vcard-types";

export interface UseContactAutosaveResult {
  activeContactId: string | null;
  /** Persists the outgoing contact's pending edit, then activates `id`. */
  selectContact: (id: string) => Promise<void>;
  /** Writes any pending debounced edit right now (before exporting, etc.). */
  flushPendingSave: () => Promise<void>;
  /** Drops the pending edit unsaved — used when its contact is deleted. */
  cancelPendingSave: () => void;
  /** Replaces the form contents *and* persists them to the active contact. */
  applyToActiveContact: (data: VCardData) => Promise<void>;
}

/**
 * Binds the editor form to the active contact: loads it on selection and
 * autosaves edits back to IndexedDB.
 *
 * The dangerous case is switching contacts with an edit still in flight — a
 * late timer must not write the outgoing form state onto the incoming contact.
 * Two things prevent that: `selectContact` flushes before switching, and the
 * pending write captures its target id at keystroke time, so even a timer that
 * fires after a switch lands on the row the user was actually editing.
 */
export function useContactAutosave(
  methods: UseFormReturn<VCardData>,
): UseContactAutosaveResult {
  const [activeContactId, setActiveContactId] = useAtom(activeContactIdAtom);

  // Read straight from the store rather than mirroring the atom into a ref, so
  // long-lived callbacks (the watch subscription, debounced writes) always see
  // the current selection without having to resubscribe when it changes.
  const store = useStore();

  const isLoadingRef = useRef(false);
  const pendingRef = useRef<{ id: string; data: VCardData } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Bumped by applyToActiveContact so any in-flight load-effect callback
  // knows the form has been replaced externally and must not overwrite it.
  const loadVersionRef = useRef(0);

  // What the active contact looked like the last time we loaded or saved it.
  // Writes that would be a no-op are dropped by comparing against this — see
  // the watch subscription for why that matters.
  const lastSavedRef = useRef<{ id: string; serialized: string } | null>(null);

  const rememberSaved = (id: string, data: VCardData) => {
    lastSavedRef.current = { id, serialized: JSON.stringify(data) };
  };

  const flushPendingSave = async () => {
    clearTimeout(timerRef.current);
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!pending) return;

    // Serializing here rather than per keystroke keeps this to at most one
    // comparison per debounce window.
    const serialized = JSON.stringify(pending.data);
    const lastSaved = lastSavedRef.current;
    if (lastSaved?.id === pending.id && lastSaved.serialized === serialized) {
      return;
    }

    await ContactDBQueries.updateContact(pending.id, pending.data);
    lastSavedRef.current = { id: pending.id, serialized };
  };

  const cancelPendingSave = () => {
    clearTimeout(timerRef.current);
    pendingRef.current = null;
  };

  const selectContact = async (id: string) => {
    await flushPendingSave();
    setActiveContactId(id);
  };

  const applyToActiveContact = async (data: VCardData) => {
    // Whole-form replacements are deliberately invisible to autosave (see the
    // watch subscription below), so they have to be written explicitly.
    // Bump the load version so any in-flight load-effect callback bails out
    // instead of overwriting this data with stale blank values.
    loadVersionRef.current++;
    cancelPendingSave();
    methods.reset(data);

    let id = store.get(activeContactIdAtom);
    if (id) {
      rememberSaved(id, data);
      await ContactDBQueries.updateContact(id, structuredClone(data));
    } else {
      // Cold-start race: the seed contact hasn't been created yet, so there
      // is no active id to update. Insert a new row and select it so the
      // subsequent ensureSeedContact sees a non-empty library and skips.
      id = await ContactDBQueries.insertContact(structuredClone(data));
      rememberSaved(id, data);
      setActiveContactId(id);
    }
  };

  // Make sure the library is never empty: the app should always open with a
  // contact ready to edit. Concurrent invocations are safe — `ensureSeedContact`
  // is transactional, so StrictMode's double effect can't create two blanks.
  useEffect(() => {
    let cancelled = false;

    if (!store.get(activeContactIdAtom)) {
      ContactDBQueries.ensureSeedContact().then((id) => {
        if (!cancelled && !store.get(activeContactIdAtom))
          setActiveContactId(id);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [store, setActiveContactId]);

  // Load the selected contact into the form.
  useEffect(() => {
    if (!activeContactId) return;

    let stale = false;
    const version = ++loadVersionRef.current;
    isLoadingRef.current = true;

    ContactDBQueries.getContactById(activeContactId).then((row) => {
      // A newer selection already won, this row was deleted in another tab,
      // or applyToActiveContact replaced the form while we were loading.
      if (stale || version !== loadVersionRef.current) return;

      if (row) {
        rememberSaved(row.id, row.data);
        methods.reset(row.data);
      } else {
        ContactDBQueries.ensureSeedContact().then((id) => {
          if (!stale) setActiveContactId(id);
        });
      }

      // Cleared in a microtask so it outlives the watch notifications that
      // `reset` fires synchronously.
      queueMicrotask(() => {
        isLoadingRef.current = false;
      });
    });

    return () => {
      stale = true;
    };
  }, [activeContactId, methods, setActiveContactId]);

  // Autosave. Subscribing to `watch` rather than reacting to the watched value
  // in an effect keeps persistence off the render path.
  //
  // Loading a contact is not as easy to filter out as it looks. `reset()` alone
  // notifies with an undefined `name`, but every mounted `useFieldArray` then
  // re-syncs and emits its own *named* notification (`phones`, `emails`, …)
  // after this effect's guard has already been cleared. Left alone, that echo
  // would rewrite the contact we just loaded and bump its `updatedAt`, so
  // simply opening a contact would jump it to the top of "Recently edited".
  // `flushPendingSave` drops writes that wouldn't change anything, which
  // catches the echo no matter when it lands.
  useEffect(() => {
    const subscription = methods.watch((_values, { name }) => {
      if (isLoadingRef.current) return;
      if (name === undefined) return;

      const id = store.get(activeContactIdAtom);
      if (!id) return;

      pendingRef.current = { id, data: structuredClone(methods.getValues()) };
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flushPendingSave();
      }, AUTOSAVE_DEBOUNCE_MS);
    });

    return () => subscription.unsubscribe();
  }, [methods, store]);

  // Shrink the window where closing the tab mid-debounce loses the last edit.
  // A synchronous flush on `beforeunload` isn't possible with async IndexedDB.
  useEffect(() => {
    const handleHidden = () => {
      if (document.visibilityState === "hidden") void flushPendingSave();
    };

    document.addEventListener("visibilitychange", handleHidden);
    return () => {
      document.removeEventListener("visibilitychange", handleHidden);
      void flushPendingSave();
    };
  }, []);

  return {
    activeContactId,
    selectContact,
    flushPendingSave,
    cancelPendingSave,
    applyToActiveContact,
  };
}
