# Multi-contact support — architecture & design

_Last updated 2026-07-18. Status: **proposed** (no code written yet)._

This is the technical design for turning Easy vCard Editor from a single-contact editor into a **contacts library**: import/manage/export many contacts, persisted locally in the browser (and in the Electron desktop app). It expands the one-liner in [`missing-features.md`](./missing-features.md) into an implementable spec. Related backlog: the multi-contact and bulk-operations sections of [`../ideas.md`](../ideas.md).

---

## 1. Overview & rationale

Today the app holds exactly one contact in a React Hook Form instance and loses it on reload. Multi-contact needs real local persistence for potentially hundreds of contacts.

**Why IndexedDB (via Dexie), not localStorage:**

- **Capacity.** localStorage is ~5 MB per origin, and vCards can embed base64 `PHOTO`/`LOGO` up to ~1 MB each (`base64-utils` caps at 1 MB). A handful of photo-bearing contacts would exhaust the budget. IndexedDB is quota-based (typically hundreds of MB to GBs).
- **Structure.** localStorage stores strings only (forcing manual `JSON.stringify` of one giant blob under a single key). IndexedDB structured-clones real objects — including `Date` and nested arrays — as **one indexed row per contact**.
- **Async & non-blocking.** localStorage is synchronous and blocks the main thread; Dexie is promise-based.
- **Offline.** IndexedDB persists across offline sessions, finally making the "offline-first" branding real, and works unchanged in the Electron renderer.

> We explicitly **reject** the "cram everything into one localStorage key" workaround. That pattern exists only to survive localStorage's limitations; Dexie gives us a proper table with per-contact rows and indexes, which is the entire point.

We mirror the persistence pattern already proven in the sibling repo `color-palette-manager`, with two deliberate corrections (see §3 and §6).

---

## 2. Data model

```ts
// src/types/contact-db.ts
import type { VCardData } from "@/types/vcard-types";

export interface StoredContact {
  id: string;            // nanoid PK — local, stable across edits. NOT the vCard UID.
  data: VCardData;       // the full existing contact payload, unchanged
  displayName: string;   // denormalized, for list sort/search without deserializing rows
  organization: string;  // denormalized index column
  createdAt: Date;       // stored as a native Date (IndexedDB structured-clones it)
  updatedAt: Date;
}
```

Notes:

- **`id` vs `data.uid`.** `id` is the local database key (nanoid), stable regardless of edits. The vCard `UID` (`data.uid`, minted via `crypto.randomUUID()` in `generateVcf`) is the *exported* identity and is not used as the DB key.
- **No remodel.** `data` is exactly today's `VCardData` (`src/types/vcard-types.ts`); nothing about the form or preview data shape changes.
- **Denormalized columns** (`displayName`, `organization`) exist purely so the list rail can sort and search via indexes, without reading and parsing every row's `data`.

---

## 3. Database — `src/db/main.ts`

```ts
import Dexie, { type EntityTable } from "dexie";
import type { StoredContact } from "@/types/contact-db";

const db = new Dexie("EasyVcfEditor") as Dexie & {
  contacts: EntityTable<StoredContact, "id">;
};

db.version(1).stores({
  // PK is a plain inbound `id` (a nanoid string). Remaining fields are indexes.
  contacts: "id, displayName, organization, createdAt, updatedAt",
});

export { db };
```

- **Correction vs. the sibling:** `color-palette-manager` declares its PK as `++id` (auto-increment) yet always writes explicit string nanoids, so auto-increment silently never fires. We declare the PK as plain **`id`** to match reality and avoid confusion.
- Indexes back the list rail's sort (`updatedAt`) and search (`displayName`, `organization`).
- **Migrations.** Schema changes bump the version: `db.version(2).stores({ … }).upgrade(tx => …)`. Keep every prior `.version()` call in place — Dexie replays them to upgrade existing users' databases. Document each bump here.
- `db` is a bare module singleton — no provider, no init step (matches the sibling).

---

## 4. ID generation — `src/constants/nanoid.ts`

```ts
import { customAlphabet } from "nanoid";

export const CONTACT_ID_LENGTH = 12;

// URL-safe alphanumeric (no `_`/`-`), so IDs are safe in future deep links.
export const ID_DICTIONARY =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const nanoidContactId = customAlphabet(ID_DICTIONARY, CONTACT_ID_LENGTH);
```

IDs are assigned in the repository layer at create time (§5), never by Dexie.

---

## 5. Repository — `src/db/queries.ts`

A static-method class wrapping all table access (mirrors the sibling's `PaletteDBQueries`). Timestamps and denorm fields are stamped here, never by callers. **All IndexedDB reads and writes should go through this typed `ContactDBQueries` layer; components should never call `db.contacts` directly, so the row shape, indexes, and timestamps stay correct at compile time.**

```ts
import { db } from "@/db/main";
import { nanoidContactId } from "@/constants/nanoid";
import { buildFullName } from "@/lib/vcf-utils";
import type { StoredContact } from "@/types/contact-db";
import type { VCardData } from "@/types/vcard-types";

export class ContactDBQueries {
  /** Derive the indexed columns from the payload. */
  private static deriveIndexFields(data: VCardData) {
    const displayName =
      buildFullName(data) || data.nickname || data.emails?.[0]?.value || "Unnamed contact";
    return { displayName, organization: data.organization ?? "" };
  }

  static async getAllContacts(): Promise<StoredContact[]> {
    return db.contacts.orderBy("updatedAt").reverse().toArray();
  }

  static async getContactById(id: string): Promise<StoredContact | undefined> {
    return db.contacts.get(id);
  }

  static async insertContact(data: VCardData): Promise<string> {
    const now = new Date();
    const id = nanoidContactId();
    await db.contacts.add({ id, data, ...this.deriveIndexFields(data), createdAt: now, updatedAt: now });
    return id;
  }

  static async updateContact(id: string, data: VCardData): Promise<void> {
    await db.contacts.update(id, { data, ...this.deriveIndexFields(data), updatedAt: new Date() });
  }

  static async deleteContact(id: string): Promise<void> {
    await db.contacts.delete(id);
  }

  /** Bulk import (multi-contact .vcf). */
  static async bulkInsertContacts(list: VCardData[]): Promise<void> {
    const now = new Date();
    const rows = list.map((data) => ({
      id: nanoidContactId(),
      data,
      ...this.deriveIndexFields(data),
      createdAt: now,
      updatedAt: now,
    }));
    await db.contacts.bulkAdd(rows);
  }

  static async clearAll(): Promise<void> {
    return db.contacts.clear();
  }

  static async count(): Promise<number> {
    return db.contacts.count();
  }
}
```

Conventions copied from the sibling: `Date` timestamps stamped in the repo, ad-hoc `try/catch` at call sites, and no ordering column (sort is index-driven or UI-layer). Create inputs take just the `VCardData`; `id`/timestamps/denorm fields are the repo's responsibility.

---

## 6. Reactivity — `src/hooks/use-contacts.ts`

A single reactive source for the list rail, using `useLiveQuery` (auto-updates on any write):

```ts
import { useLiveQuery } from "dexie-react-hooks";
import { ContactDBQueries } from "@/db/queries";

export function useContacts() {
  return useLiveQuery(() => ContactDBQueries.getAllContacts(), []);
}
```

Optional search/sort params can be threaded into the query later (filter on the indexed `displayName`/`organization`).

- **Correction vs. the sibling:** `color-palette-manager` mixes a lone `useLiveQuery` with manual `useEffect`+`useState` caches and a zustand store, so parts of its UI don't auto-update. We standardize on `useLiveQuery` everywhere and avoid the duplicate caches.

---

## 7. Selection state — jotai

The active contact is tracked in a jotai atom (jotai is already a dependency — no new state library):

```ts
// src/state/contacts-atoms.ts
import { atom } from "jotai";

export const activeContactIdAtom = atom<string | null>(null);
```

Shared by the list rail (highlight + selection), the navbar (export-selected), and the editor (which contact to load/save).

---

## 8. Autosave design

The editor binds to the active contact and autosaves. This is the **most delicate part** — a naïve implementation writes the wrong row when switching contacts.

**Load (on `activeContactId` change):**

1. Set an `isLoadingRef` guard to `true`.
2. `getContactById(id)` → `methods.reset(row.data)`.
3. Clear the guard **after** the reset settles.

The guard prevents the `reset`-triggered `watch` callback from immediately writing the just-loaded data back.

**Save (debounced ~500 ms):**

- Subscribe with react-hook-form `watch()`; on change, debounce, then `ContactDBQueries.updateContact(activeContactId, values)`.
- **Skip** the write when `activeContactId` is `null` or `isLoadingRef` is set.

**Switch safety (the footgun):** before resetting to a newly selected contact, **flush or cancel the pending debounced write bound to the *previous* id**. Otherwise a late timer can persist the outgoing form state onto the wrong contact. Capture the debounced writer per-id, or flush-before-switch.

**Lifecycle actions:**

- **New** → `insertContact(defaultVCardData)` (from `src/constants/vcard-constants.ts`), then set `activeContactIdAtom` to the returned id.
- **Delete active** → after `deleteContact`, select the next contact in the list, or clear the atom (empty state) if none remain.

---

## 9. UI surfaces (reuse-first)

- **Contact-list rail** — new `src/components/contact-list/contact-list.tsx`, a left column added to the layout in `src/components/vcf-editor.tsx`. Each row: avatar initials (`buildInitials`), `displayName`, organization, and an active highlight driven by `activeContactIdAtom`. A sticky **search + sort header** (see §9.1) is pinned above the scrollable list; the rail also has a **New** button, per-row delete, and multi-select checkboxes for batch actions.
- **Navbar** (`src/components/editor-navbar.tsx`) — the **Import** flow accepts multi-contact files (§10); the Download `SplitButton` gains **Export all** and **Export selected** items.
- **Form & preview unchanged** — `contact-form.tsx`, `preview-tabs.tsx`, and `contact-preview.tsx` keep working exactly as today; they simply operate on whichever contact is active.

Layout note: the desktop view becomes three columns (list · form · preview). The existing preview collapse handle and the mobile preview-overlay behavior still apply; the rail should collapse to a drawer on small screens.

### 9.1 Search, filter & sort (rail header)

A **presentational** `src/components/contact-list/contact-list-filters.tsx` (a search `Input` + a sort `Select`) is pinned at the top of the rail, above the scrollable list. It takes `{ filters, onFiltersChange }` and owns no logic — state and filtering live in a hook, mirroring the sibling's presentational-vs-state split.

**Approach: filter/sort in-memory** over the already-loaded `useLiveQuery` result — the DB layer keeps doing `getAllContacts()` (`toArray()`), and a `useMemo` filters/sorts the array. This mirrors `color-palette-manager` and stays consistent with our reactive list. Rationale for *not* pushing it into Dexie: substring/contains across several fields can't use an IndexedDB index efficiently — Dexie's `.filter()` is a full cursor scan, no better than in-memory. The only index-backed option is `displayName` prefix search (`.startsWithIgnoreCase(...)`), a poor fit for "search anywhere". Comfortable for tens–hundreds of contacts; the `displayName` index and list virtualization are the escape hatches if it ever reaches thousands.

**New hook `src/hooks/use-contact-filters.ts`** owns the state and the memo:

```ts
export type ContactSortBy = "updatedAt" | "createdAt" | "displayName";
export type SortOrder = "asc" | "desc";
export interface ContactFilters {
  search: string;
  sortBy: ContactSortBy;
  sortOrder: SortOrder;
}

export function useContactFilters(contacts: StoredContact[] | undefined) {
  const [filters, setFilters] = useState<ContactFilters>({
    search: "",
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const filtered = useMemo(() => {
    const list = contacts ?? [];
    const q = filters.search.trim().toLowerCase();
    const matched = q
      ? list.filter(
          (c) =>
            c.displayName.toLowerCase().includes(q) ||
            c.organization.toLowerCase().includes(q) ||
            c.data.emails?.some((e) => e.value?.toLowerCase().includes(q)) ||
            c.data.phones?.some((p) => p.value?.toLowerCase().includes(q))
        )
      : list;

    const dir = filters.sortOrder === "asc" ? 1 : -1;
    // Copy first — the input is Dexie's cached useLiveQuery array; never sort it in place.
    return [...matched].sort((a, b) => {
      const cmp =
        filters.sortBy === "displayName"
          ? a.displayName.localeCompare(b.displayName)
          : a[filters.sortBy].getTime() - b[filters.sortBy].getTime();
      return cmp * dir;
    });
  }, [contacts, filters]);

  return { filters, setFilters, filtered };
}
```

Details:

- **Search scope:** the denormalized `displayName` and `organization` columns, plus primary `emails`/`phones` read from `data`. Case-insensitive `includes`, trimmed. (Accent/diacritic folding is an optional refinement, not in the baseline.)
- **Sort:** one ascending comparator per field (`localeCompare` for name, `Date.getTime()` diff for timestamps), negated for `desc` — the rail's sort `Select` uses a combined `` `${sortBy}-${sortOrder}` `` value like the sibling.
- **Two flaws we fix (vs. the sibling):** always **copy before sorting** (`[...matched].sort()`) — mutating Dexie's cached array in place would be a subtle bug — and never sort the source array.
- **Filter state is rail-local `useState`**, not jotai — filters aren't shared, so they stay local. jotai remains reserved for the shared `activeContactIdAtom`.
- **Debounce:** not required at this scale; in-memory filtering per keystroke is cheap. A small `use-debounce` helper can be added later if the list grows large.
- **Optional (kept out of the simple core):** a category/tag filter (contacts carry `categories`) and a "has photo" toggle.

---

## 10. Parser / exporter changes — `src/lib/vcf-utils.ts`

`parseVcf` currently reads only the first card in a file. Refactor and extend:

- Extract the current single-card parse body into `parseSingleVcard(block: string): VCardData`.
- `parseVcf(text)` stays as-is behaviorally (parses the first `BEGIN`/`END:VCARD` block) — no breaking change for existing callers.
- Add **`parseVcfCollection(text: string): VCardData[]`** — split on `BEGIN:VCARD` … `END:VCARD` boundaries and map each block through `parseSingleVcard`. Feeds `ContactDBQueries.bulkInsertContacts`.
- Add **`generateVcfCollection(list: VCardData[], version): string`** — map each through the existing `generateVcf` and join with newlines.
- Add **`downloadVcfCollection(list, version)`** — Blob download of the joined output (e.g. `contacts.vcf`).

Existing helpers to reuse as-is: `generateVcf`, `downloadVcf`, `buildFullName`, `buildInitials`.

---

## 11. Platform notes

- **No SSR** (Vite SPA) — no `typeof window` guard needed around the Dexie singleton.
- **Electron** — IndexedDB is available in the sandboxed renderer; no change to `electron/main.ts`.
- **PWA** — the IndexedDB store persists offline alongside the existing service worker.

---

## 12. New dependencies

Run `npm install <package>` for each dependency to install the latest version. The entry in `package.json` will be pinned to the installed major with `^` automatically.

| Package | Why |
|---|---|
| `dexie` | IndexedDB wrapper |
| `dexie-react-hooks` | `useLiveQuery` reactivity |
| `nanoid` | contact IDs. Currently only transitive via postcss; add directly. **ESM-only — fine, the app is `"type":"module"`.** |
| `fake-indexeddb` (dev, optional) | unit-test the repo in Vitest |

---

## 13. Testing & rollout

**Tests (Vitest):**

- `parseVcfCollection` / `generateVcfCollection` round-trip on multi-contact fixtures.
- `ContactDBQueries` CRUD + `bulkInsertContacts` against `fake-indexeddb`.
- `useContactFilters` filtering/sorting a fixture array — the memo body is a pure function of `(contacts, filters)`, so it tests without IndexedDB (assert search matches, sort order, and that the input array is not mutated).

**Suggested phasing:**

1. `src/types/contact-db.ts`, `src/constants/nanoid.ts`, `src/db/main.ts`, `src/db/queries.ts` (+ repo tests).
2. `parseVcfCollection` / `generateVcfCollection` / `downloadVcfCollection` in `vcf-utils.ts` (+ round-trip tests).
3. `activeContactIdAtom`, `use-contacts.ts`, `use-contact-filters.ts`, the list rail + `contact-list-filters.tsx`, and the autosave/load wiring in `vcf-editor.tsx`.
4. Multi-import + Export all/selected in the navbar.

**Manual end-to-end check:** import a multi-contact `.vcf` → the rail lists every contact; edit one → changes autosave; reload the page → data persists; switch contacts rapidly → no cross-writes; Export all → re-imports to an equivalent set.

---

## 14. See also

- [`missing-features.md`](./missing-features.md) — the broader UI-fit feature catalog.
- [`todo.md`](./todo.md) — task tracker (add subitems here when work starts).
- [`../ideas.md`](../ideas.md) — multi-contact & bulk-operations backlog.
