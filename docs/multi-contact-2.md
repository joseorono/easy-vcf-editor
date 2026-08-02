# Multi-contact — implementation plan

_Last updated 2026-08-01. Status: **ready to implement**._

Execution plan for the architecture in [`multi-contact.md`](./multi-contact.md). That document is the approved design (Dexie/IndexedDB library, repository layer, jotai active-id atom, autosave, contact-list rail, multi-card parse/generate); this one resolves how it wires into the existing UI and records the product decisions made on top of it.

---

## 1. Context

Easy vCard Editor currently holds exactly one contact in a single React Hook Form instance inside `src/components/vcf-editor.tsx`, and loses it on reload. `parseVcf` reads only the first card of a file and the app apologizes for it with a "only the first one was imported" toast. This change turns the app into a persisted contacts library: many contacts in IndexedDB, a left-hand list rail feeding the existing editor, autosave, and multi-card import/export.

The form, the preview, and the vCard field model do not change. `VCardData` stays exactly as it is; a contact is just a `VCardData` wrapped in a stored row.

### Decisions made for this pass

| Decision | Choice |
|---|---|
| **Import behavior** | **Ask per import.** A single-card file offers "Add as new" vs "Replace current"; a multi-card file offers add-only ("Import N contacts"). If the active contact is empty, a single-card import goes straight into it with no dialog — today's behavior. |
| **Empty library** | **Auto-create.** If the database has zero contacts on load, silently insert one blank contact and select it, so the app still opens ready to type. |
| **Mobile rail** | **Hand-rolled left slide-in**, mirroring the existing preview panel pattern. No shadcn Sheet. |
| **Scope** | **Core + Export all.** Rail with search/sort, per-row delete, New, autosave, multi-card import, Export all. Multi-select checkboxes, Export selected, and batch delete are deferred. |

### Deviations from the design doc

- **§9.1's `useMemo`.** `AGENTS.md` forbids manual memoization — the React Compiler handles it. The filtering logic moves into a pure function in `src/lib/`, called directly during render. The doc's substantive point stands and is non-negotiable: **copy before sorting** (`[...matched].sort(...)`), because the input is Dexie's cached `useLiveQuery` array and sorting it in place is a real bug.
- **`bulkInsertContacts` returns `Promise<string[]>`**, not `void`, so an import can select the first contact it created.
- **New repository method `ensureSeedContact()`** for the auto-create decision.
- **No multi-select checkboxes** (doc §9 mentions them; deferred by scope decision).
- **`EditorNavbar`'s `onNew` prop is renamed `onClear`** — see §6.3.

---

## 2. Dependencies

```
npm install dexie dexie-react-hooks nanoid
npm install -D fake-indexeddb
```

`jotai` (^2.15.2) is already a dependency and currently unused — this feature introduces the first atoms.

---

## 3. Phase 1 — persistence layer

Follow the design doc's code for these files; they need no adaptation beyond what's noted.

| File | Contents |
|---|---|
| `src/types/contact-db.ts` | `StoredContact` — `id`, `data: VCardData`, `displayName`, `organization`, `createdAt: Date`, `updatedAt: Date`. |
| `src/constants/nanoid.ts` | `CONTACT_ID_LENGTH`, `ID_DICTIONARY`, `nanoidContactId`. |
| `src/constants/contacts.ts` | `AUTOSAVE_DEBOUNCE_MS = 500`, `DEFAULT_CONTACT_FILTERS`. |
| `src/db/main.ts` | Dexie singleton `"EasyVcfEditor"`, `db.version(1).stores({ contacts: "id, displayName, organization, createdAt, updatedAt" })`. Plain `id` PK, not `++id`. |
| `src/db/queries.ts` | `ContactDBQueries` static class — the only code that touches `db.contacts`. |

`ContactDBQueries`: `getAllContacts`, `getContactById`, `insertContact`, `updateContact`, `deleteContact`, `bulkInsertContacts` (→ `string[]`), `clearAll`, `count`, plus `ensureSeedContact` below. `deriveIndexFields` stamps `displayName` (via the existing `buildFullName` from `src/lib/vcf-utils.ts`, falling back to nickname → first email → `"Unnamed contact"`) and `organization`. Timestamps are stamped here, never by callers. No import cycle: `vcf-utils` never imports from `db`.

**`ensureSeedContact()`** implements auto-create and must survive React StrictMode running effects twice in dev:

```ts
/**
 * Guarantees the library has at least one contact and returns the id to select.
 * The rw transaction serializes concurrent calls (StrictMode's double effect),
 * so the second caller sees the row the first inserted instead of adding another.
 */
static async ensureSeedContact(): Promise<string> {
  return db.transaction("rw", db.contacts, async () => {
    const existing = await db.contacts.orderBy("updatedAt").reverse().first();
    if (existing) return existing.id;
    return this.insertContact(createBlankVCardData());
  });
}
```

This is also reused when the user deletes the last remaining contact.

---

## 4. Phase 2 — vCard collection parse/generate

All in `src/lib/vcf-utils.ts`, per design doc §10. JSDoc on each new export.

1. **Extract `parseSingleVcard(block: string): VCardData`** — the current body of `parseVcf` (L67-276), unchanged. It already breaks at the first `END:VCARD` and does its own unfolding, so it is self-contained per block.
2. **`parseVcf(text)` becomes a one-line delegate** to `parseSingleVcard`. Behaviorally identical (first card only), so `src/lib/vcf-utils.test.ts` L172-195 stays green.
3. **`parseVcfCollection(text: string): VCardData[]`** — segment on card starts, then parse each block:
   ```ts
   const blocks = text.split(/(?=BEGIN:VCARD)/i).filter((b) => /^\s*BEGIN:VCARD/i.test(b));
   return blocks.map(parseSingleVcard);
   ```
   Splitting the *raw* text is safe because RFC folding never continues across a `BEGIN:VCARD` line, and each block then gets its own unfold / quoted-printable pass. Keying off `BEGIN` markers (not blank lines) is required — `unfoldLines` drops blank lines entirely. Callers, not this function, filter empties with `isVCardEmpty`. Document in the JSDoc that nested `AGENT` vCards are unsupported (they were before, too).
4. **`generateVcfCollection(list: VCardData[], version: VCardVersion = "4.0"): string`** — map through the existing `generateVcf` and `join("\r\n")`. `generateVcf` emits no trailing CRLF, so a single join is correct; append a trailing CRLF at end of file.
5. **`downloadVcfCollection(list, version, filename = "contacts.vcf")`** — same Blob/anchor mechanics as `downloadVcf`.
6. **`createBlankVCardData(): VCardData`** — `JSON.parse(JSON.stringify(defaultVCardData))`. The single canonical deep-clone used by seeding, New, Clear, and form defaults. `defaultVCardData` contains mutable nested arrays (`emails`, `phones`, `addresses`, `urls`); sharing it across rows would let editing one contact mutate the template. The two existing `methods.reset(defaultVCardData)` call sites migrate to this.

Reuse `generateVcf`, `downloadVcf`, `buildFullName`, `buildInitials`, `isVCardEmpty` as-is.

> Round-trip tests must assert **parsed field equality, not string equality** — `generateVcf` mints a fresh `UID:urn:uuid:<random>` whenever `data.uid` is empty (L629-634) and stamps a fresh `REV`, so output is non-deterministic.

---

## 5. Phase 3 — state, reactivity, autosave

### 5.1 Atoms — `src/state/contacts-atoms.ts`

```ts
export const activeContactIdAtom = atom<string | null>(null);
```

Use jotai's **default store — no `Provider`** in `src/main.tsx`. Nothing needs one; the DB singleton is provider-less and the atom follows suit. (Component tests that read atoms can wrap in a local `Provider` for isolation, the way `contact-form.test.tsx` already wraps its own `FormProvider`.)

### 5.2 `src/hooks/use-contacts.ts`

`useLiveQuery(() => ContactDBQueries.getAllContacts(), [])`. Returns `StoredContact[] | undefined` — `undefined` means the first query is still in flight, which the rail must not render as "no contacts".

### 5.3 Filters — pure function + thin hook

Splitting the logic out is what lets us satisfy both the doc and the no-memo rule, and it makes the interesting part testable without IndexedDB or React.

- **`src/types/contact-filters.ts`** — `ContactSortBy`, `SortOrder`, `ContactFilters` (doc §9.1 shapes).
- **`src/lib/contact-filters.ts`** — `filterAndSortContacts(contacts: StoredContact[] | undefined, filters: ContactFilters): StoredContact[]`, the doc's memo body: case-insensitive `includes` over `displayName`, `organization`, and the `emails`/`phones` values inside `data`; then `[...matched].sort(...)` — copy first, always.
- **`src/hooks/use-contact-filters.ts`** — `useState(DEFAULT_CONTACT_FILTERS)` plus a plain call to `filterAndSortContacts` during render (no `useMemo`; the React Compiler handles it). Returns `{ filters, setFilters, filtered }`. Filter state is rail-local — jotai stays reserved for the shared active id.

### 5.4 `src/hooks/use-contact-autosave.ts` — the delicate part

This is where a naïve implementation writes the wrong row. Public surface:

```ts
export interface UseContactAutosaveResult {
  activeContactId: string | null;
  /** Flush the outgoing contact's pending write, then activate `id`. */
  selectContact: (id: string) => Promise<void>;
  /** Persist any pending debounced write immediately (before export, New, etc.). */
  flushPendingSave: () => Promise<void>;
  /** Drop the pending write without saving (the active contact was deleted). */
  cancelPendingSave: () => void;
  /** Reset the form to `data` AND persist it to the active row. */
  applyToActiveContact: (data: VCardData) => Promise<void>;
}
export function useContactAutosave(methods: UseFormReturn<VCardData>): UseContactAutosaveResult;
```

Internals, all refs: `isLoadingRef`, `activeIdRef` (mirrors the atom, assigned during render — the same pattern the file already uses for `versionRef` at L87-88, so the watch subscription registers once instead of re-subscribing per selection), `pendingRef: { id, data } | null`, `timerRef`.

**Save — a `methods.watch(callback)` subscription, not a `useEffect` on `watchedData`.** `watchedData` already feeds the preview through `useDeferredValue`; putting persistence on the render path would couple saving to render timing for no benefit.

> **Corrected during implementation.** The plan assumed react-hook-form reports `name === undefined` for a programmatic `reset()`, and that this alone could tell a load apart from a user edit. A probe test disproved it: `reset()` does notify with an undefined name, but **every mounted `useFieldArray` then re-syncs and emits its own named notification** (`phones`, `emails`, …) *after* the microtask that clears the loading guard. Left unhandled, opening a contact rewrote it and bumped `updatedAt`, so merely viewing a contact jumped it to the top of "Recently edited".
>
> The fix is a `lastSavedRef` holding `{ id, serialized }` for the contact as last loaded or saved. `flushPendingSave` serializes the pending payload and skips the write when it matches — catching the echo regardless of when it lands, and dropping redundant writes generally. Serializing at flush time rather than per keystroke keeps it to one comparison per debounce window. The `name === undefined` check stays as a cheap early-out, but nothing depends on it.

```ts
useEffect(() => {
  const sub = methods.watch((_values, { name }) => {
    if (isLoadingRef.current) return;
    if (name === undefined) return;            // reset()/whole-form replace — never autosaved
    const id = activeIdRef.current;
    if (!id) return;
    pendingRef.current = { id, data: structuredClone(methods.getValues()) };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flushPendingSave(), AUTOSAVE_DEBOUNCE_MS);
  });
  return () => sub.unsubscribe();
}, []);
```

**The id is captured when the keystroke happens, not when the timer fires.** That is what makes a late-firing timer harmless rather than dangerous — it writes to the contact the user was actually editing.

**`applyToActiveContact` exists because resets are deliberately not autosaved:** any code path that replaces the whole form must persist explicitly. Silently relying on autosave after a `reset()` would drop the data.

```ts
async function flushPendingSave() {
  clearTimeout(timerRef.current);
  const pending = pendingRef.current;
  pendingRef.current = null;
  if (pending) await ContactDBQueries.updateContact(pending.id, pending.data);
}
function cancelPendingSave() { clearTimeout(timerRef.current); pendingRef.current = null; }
async function selectContact(id: string) { await flushPendingSave(); setActiveContactId(id); }
async function applyToActiveContact(data: VCardData) {
  cancelPendingSave();
  methods.reset(data);
  const id = activeIdRef.current;
  if (id) await ContactDBQueries.updateContact(id, structuredClone(data));
}
```

**Load** — an effect on `activeContactId`:

1. Set `isLoadingRef.current = true`, then `getContactById(activeContactId)`.
2. A `let stale = false` + cleanup guard drops out-of-order resolutions from rapid switching.
3. `methods.reset(row.data)`, then clear the guard in a `queueMicrotask` so it outlives the synchronous watch notifications `reset` fires.
4. If the row is gone (deleted in another tab), fall back to `ensureSeedContact()` and select its result rather than leaving the atom null.

**Bootstrap** — a mount effect: if `activeIdRef.current` is null, `ensureSeedContact()` → set the atom. Correctness against StrictMode comes from the transaction in §3; the ref check just keeps it quiet.

**Cleanup** — flush on unmount, plus a `visibilitychange → hidden` listener that flushes, shrinking the loss window when a tab is closed mid-debounce. A truly synchronous `beforeunload` flush is impossible with async IndexedDB; the ≤500 ms residual risk is accepted and documented.

> The `debounce` helper in `src/lib/utils.ts` (L10, currently unused) is **not** used here — it exposes no `cancel`/`flush`, and we need both plus per-id binding. Leave the shared util untouched.

---

## 6. Phase 4 — UI

### 6.1 Contact-list rail — `src/components/contact-list/`

**`contact-list-filters.tsx`** — presentational only, `{ filters, onFiltersChange }`. A search `Input` with a leading `Search` icon, and a sort `Select` whose value is the combined `` `${sortBy}-${sortOrder}` `` (items: "Recently edited", "Recently added", "Name A–Z", "Name Z–A"). Owns no logic.

**`contact-list.tsx`** — props:

```ts
interface ContactListProps {
  isOpen: boolean;                              // mobile slide-in visibility
  onClose: () => void;
  isCollapsed: boolean;                         // desktop collapse
  onSelectContact: (id: string) => void;
  onNewContact: () => void;
  onDeleteContact: (id: string) => Promise<void>;
}
```

Consumes `useContacts()` + `useContactFilters()`, and reads `activeContactIdAtom` **read-only** via `useAtomValue` — writes go through `onSelectContact` so the flush-before-switch always happens. Local `deleteCandidate: StoredContact | null` drives one shared `AlertDialog` ("Delete {displayName}? This can't be undone.").

Layout: header ("Contacts" + count `Badge` + a `Plus` New button + a mobile-only "Back to form" ghost button), the filters bar pinned below it, then a `ScrollArea` of rows. Each row is a `button` with an `Avatar` (`AvatarImage` from `data.photo` when set, `AvatarFallback` = `buildInitials`), truncated `displayName`, muted truncated `organization`, `bg-accent` when active, and a `Trash2` ghost button that `stopPropagation()`s. Row click calls `onSelectContact` then `onClose()` (harmless on desktop, where `isOpen` only matters below `lg`). `contacts === undefined` renders an empty body; a filtered-to-nothing list renders muted "No matches".

### 6.2 Layout in `vcf-editor.tsx`

New child order inside the dropzone container (L300): drag overlay → **rail** → **rail collapse handle** → form panel → preview collapse handle → preview panel.

- **Desktop:** `lg:static lg:w-72 xl:w-80` with `border-r border-border/50`; an `isRailCollapsed` state and a collapse handle mirroring the preview's (L329-346) with chevrons flipped. On 1024–1280 px the three columns are tight but the form keeps roughly 280 px, and either side collapses to reclaim space.
- **Mobile:** mirror the preview panel from the left — `fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw]`, `-translate-x-full` → `translate-x-0` when `isContactListOpen`, plus a `z-40` backdrop (matching the existing drawer-menu backdrop) that closes on tap. Inner `pb-16 lg:pb-0` keeps the last rows clear of the bottom action bar, which sits later in the DOM at `z-50` and therefore paints above — the same coexistence the preview panel already relies on.

**Mobile toggle** goes in the **bottom action bar**, not the navbar: a `Users` icon button before the Import SplitButton. It's thumb-reachable, and the mobile navbar row is already full with the hamburger and preview buttons.

### 6.3 Navbar

`EditorNavbar` stays purely presentational. Changes:

```ts
onNew: () => void;        →  onClear: () => void;
onExportAllVcf: () => void;   // new
```

**Why the rename:** today's `onNew` does double duty. With a library, "make a new contact" is the rail's New button, while the navbar's existing Clear AlertDialog means "wipe the fields of the contact I'm looking at". Keeping these distinct avoids a Clear button that silently spawns library rows; the dialog copy already says "Clear this contact?", so it fits.

**Download SplitButton** gains `{ id: "vcf-all", label: "Export all (.vcf)" }` after the `vcf` item. This menu array is **duplicated verbatim** in the mobile bottom action bar inside `vcf-editor.tsx` (L446-509) — add the item in **both** places or it silently goes missing on mobile.

### 6.4 Lifecycle handlers

- **New** (rail) → `await flushPendingSave()`; `insertContact(createBlankVCardData())`; `selectContact(id)`.
- **Clear** (navbar / mobile menu) → `applyToActiveContact(createBlankVCardData())`.
- **Delete** → capture the neighbor from the **pre-delete** list so selection lands sensibly:
  ```ts
  const wasActive = id === activeContactId;
  if (wasActive) cancelPendingSave();          // never resurrect a deleted row
  const rows = await ContactDBQueries.getAllContacts();
  const idx = rows.findIndex((r) => r.id === id);
  const neighborId = rows[idx + 1]?.id ?? rows[idx - 1]?.id ?? null;
  await ContactDBQueries.deleteContact(id);
  if (wasActive) await selectContact(neighborId ?? (await ContactDBQueries.ensureSeedContact()));
  ```
  Deleting the last contact therefore auto-creates a fresh blank one, consistent with the empty-library decision.

---

## 7. Phase 5 — import & export

### 7.1 Import state machine

Replace `pendingImportText` / `showImportWarning` (L83-86) with:

```ts
type PendingImport =
  | { kind: "single"; data: VCardData }
  | { kind: "multi"; list: VCardData[] };
const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
```

Central entry `handleIncomingVcfText(text: string): boolean` — all three sources (window drop, file picker, paste) funnel into it. The boolean keeps the existing `ImportVcardDialog` `onImportText` contract (`true` ⇒ the dialog may close):

1. `/BEGIN:VCARD/i` fails → existing "Import failed" toast, return `false`.
2. `const list = parseVcfCollection(text).filter((d) => !isVCardEmpty(d))`.
3. `list.length === 0` → existing "This vCard is empty" info toast, return `false`.
4. **Single card, active contact empty** → fast path, today's behavior: `applyToActiveContact(list[0])`, success toast, return `true`.
5. **Single card, active contact has content** → `setPendingImport({ kind: "single", data: list[0] })`, return `false`.
6. **Multi card** (always asks, even when the active contact is empty) → `setPendingImport({ kind: "multi", list })`, return `false`.

**Chooser dialog** — one `AlertDialog` keyed on `pendingImport !== null`, replacing the current "Replace contact?" dialog (L416-443), with content branching on `kind`:

- **single:** "Add {name} to your library, or replace the current contact?" → Cancel | "Replace current" | **"Add as new"**.
  - Add as new → `await flushPendingSave()`; `insertContact(data)`; `selectContact(id)`.
  - Replace current → `await applyToActiveContact(data)`. **This must be the explicit apply, not a bare `methods.reset`** — resets are filtered out of autosave by design (§5.4), so a plain reset would leave the import unpersisted.
- **multi:** "Import {N} contacts?" → Cancel | **"Import {N} contacts"**.
  ```ts
  const activeWasEmpty = isVCardEmpty(methods.getValues());
  const priorActiveId = activeContactId;
  const ids = await ContactDBQueries.bulkInsertContacts(list);
  if (activeWasEmpty && priorActiveId) {
    cancelPendingSave();
    await ContactDBQueries.deleteContact(priorActiveId);   // drop the stray blank placeholder
  }
  await selectContact(ids[0]);
  ```
  Cleaning up the blank placeholder keeps a first-run auto-created contact from lingering above an imported library. A non-empty active contact is left alone.

**Dropzone flips to `multiple: true`** (L163). `onDrop` reads every accepted file and joins the texts with `\r\n` before calling `handleIncomingVcfText` — `parseVcfCollection` re-segments on `BEGIN:VCARD`, so a multi-file drop is just a bigger collection. Mirror the same change in `src/components/import-vcard-dialog.tsx`'s own dropzone and update the drag-overlay copy to "file(s)". This also closes the "drag-and-drop phase 2" item in `missing-features.md` (L45-46).

**The "only the first one was imported" toast (L128-134) is deleted** — it exists solely to apologize for the limitation this feature removes.

### 7.2 Export all

```ts
const handleExportAllVcf = async () => {
  await flushPendingSave();                                   // never export stale data
  const rows = await ContactDBQueries.getAllContacts();
  const list = rows.map((r) => r.data).filter((d) => !isVCardEmpty(d));
  if (list.length === 0) {
    toast.error("Nothing to export", { description: "Your library has no filled-in contacts." });
    return;
  }
  downloadVcfCollection(list, version);
  toast.success("Contacts exported", { description: `${list.length} contacts downloaded as contacts.vcf` });
};
```

Single-contact export, QR export, contact-image export, and the Ctrl+S handler keep reading `methods.getValues()` and are unchanged.

### 7.3 WebMCP

`use-webmcp.ts` itself needs no changes. Two of the six methods in `vcf-editor.tsx` (L261) re-route so their effects persist:

- `setContact` → `applyToActiveContact(data)` (was `methods.reset`).
- `importVCardText` → parse with `parseVcf` (first card only, as its tool description already says) then `applyToActiveContact`.
- `clearContact` → the renamed `handleClearContact`; `getContact`, `getVCardText`, `exportVCard` unchanged.

Library-level MCP methods (`listContacts`, `selectContact`) are out of scope for this pass.

### 7.4 Cleanup in `vcf-editor.tsx`

Remove `pendingImportText`, `showImportWarning`, the old `importFromText`, the multi-contact apology toast, and the old replace-only AlertDialog. Rename `handleNew` → `handleClearContact`. Both `methods.reset(defaultVCardData)` call sites become `createBlankVCardData()`.

---

## 8. Tests

Vitest, co-located. There is no `setupFiles`, so `import "fake-indexeddb/auto"` goes at the top of the DB test file — **before** any `@/db/*` import, so the Dexie singleton binds to the fake.

| File | Covers |
|---|---|
| `src/lib/vcf-utils.test.ts` (extend) | `parseVcfCollection` segmentation on a 3-card fixture; single-card text → 1-element array; garbage → `[]`; `generateVcfCollection` → `parseVcfCollection` round-trip on field equality. **The existing "imports only the first vCard" test (L172-195) stays untouched and green.** |
| `src/db/queries.test.ts` (new) | CRUD round-trip; `updateContact` re-deriving `displayName`/`updatedAt`; `bulkInsertContacts` returning N distinct ids; `getAllContacts` ordering; `Date` values surviving as `Date`; `ensureSeedContact` idempotent under `Promise.all([call, call])` with `count() === 1`. |
| `src/lib/contact-filters.test.ts` (new) | Search hits name/org/email/phone, case-insensitivity, all four sort combinations, and — explicitly — that the input array is **not mutated**. Pure function, no IndexedDB, no React. |

Deliberately skipped per `AGENTS.md` ("test sparingly"): the autosave hook and rail components, covered by the manual script below. If wanted later, the autosave hook is testable with `renderHook` + `fake-indexeddb` + `vi.useFakeTimers()`.

Fixtures follow the existing inline-template-literal convention; there are no `.vcf` files in the repo.

Also add a work-log subitem to `docs/todo.md` (design doc §14 asks for it) and flip `multi-contact.md`'s status line off "proposed" once merged.

---

## 9. Risks & edge cases

1. **Cross-contact writes** — three layers of defense: `selectContact` flushes before switching; the pending snapshot captures its target id at schedule time; the load effect uses a `stale` flag against out-of-order reads.
2. **`reset` echo writes** — field arrays re-sync after a load and emit named notifications past the loading guard. Neutralized by the no-op write check in `flushPendingSave` (§5.4), with a regression test asserting that opening a contact leaves its `updatedAt` untouched.
2b. **Dexie transactions and `async`/`await`** — native `await` inside a `db.transaction()` callback drops Dexie's zone tracking and throws `PrematureCommitError`. `ensureSeedContact` uses Dexie promise chaining instead.
2c. **jotai's default store is module-global** — fine for the app (one store for its lifetime), but tests must wrap in a `Provider` or the active contact id leaks between them.
3. **Whole-form replacements silently not saving** — the flip side of that filter. Every replace path must go through `applyToActiveContact`.
4. **StrictMode double effects** — transactional `ensureSeedContact`, idempotent load effect, symmetric subscribe/unsubscribe.
5. **`defaultVCardData` shared nested arrays** — all minting goes through `createBlankVCardData()`.
6. **Dexie's cached array** — never sort or splice `useLiveQuery`'s result in place.
7. **`Date` round-trip** — IndexedDB structured-clones `Date` natively, so `.getTime()` in the sort comparator is safe and `fake-indexeddb` matches. No serialization needed.
8. **Duplicated mobile menus** — the Import/Download SplitButton arrays exist twice; both need the new item.
9. **Existing test lock-in** — `vcf-utils.test.ts` asserts first-card-only `parseVcf` behavior; the refactor must preserve it, not "fix" it.
10. **Data loss on tab close** — ≤500 ms window, mitigated by the `visibilitychange` flush; accepted residual risk.

---

## 10. Verification

Automated: `npm run test-cli`.

Manual end-to-end (the maintainer runs builds):

1. Fresh profile → exactly one blank contact auto-created and selected. Check DevTools → IndexedDB for exactly one row, including after a dev-mode StrictMode double mount.
2. Type a name → the rail row's label updates within ~1 s → reload → the edit persisted.
3. Switch contacts rapidly while typing → no contact ends up with another's data.
4. Add and remove phone/email rows → they persist (this is the field-array notification check from §5.4).
5. Drop a multi-card `.vcf` → "Import N contacts?" → all appear in the rail, and the blank placeholder is gone.
6. Drop a single-card `.vcf` onto a non-empty contact → add-vs-replace dialog → both branches persist correctly.
7. Drop a single-card file onto an empty contact → imports silently, no dialog.
8. Drop several `.vcf` files at once → all contacts imported.
9. Search and sort in the rail → correct results and ordering, no console errors.
10. Delete the active contact → selection moves to a neighbor; delete the last one → a blank contact is auto-created.
11. Export all → re-import into a fresh database → an equivalent set of contacts.
12. Below 1024 px → the rail slides in from the left, the backdrop closes it, the bottom bar stays usable, and its Download menu includes "Export all".
13. Desktop → both collapse handles work; Ctrl+S still exports the active contact.

---

## 11. See also

- [`multi-contact.md`](./multi-contact.md) — the architecture this plan executes.
- [`missing-features.md`](./missing-features.md) — §5 multi-contact, and the drag-and-drop phase 2 item this closes.
- [`todo.md`](./todo.md) — add subitems here when work starts.
