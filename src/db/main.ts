import Dexie, { type EntityTable } from "dexie";
import type { StoredContact } from "@/types/contact-db";

// Names the browser-level database. Changing it points the app at a different
// store, so it is effectively permanent once the feature ships.
const db = new Dexie("EasyVcardManager") as Dexie & {
  contacts: EntityTable<StoredContact, "id">;
};

// The primary key is a plain inbound `id` (a nanoid minted in the repository
// layer), not `++id` — Dexie never generates keys for this table. The remaining
// columns are indexes backing the contact list's sort and search.
//
// Schema changes bump the version with `db.version(2).stores({…}).upgrade(…)`;
// keep every prior `.version()` call in place, since Dexie replays them to
// migrate existing users' databases.
db.version(1).stores({
  contacts: "id, displayName, organization, createdAt, updatedAt",
});

export { db };
