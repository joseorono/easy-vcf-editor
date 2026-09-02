import type { VCardData } from "@/types/vcard-types";

/**
 * One contact as stored in IndexedDB.
 *
 * `id` is the local database key (a nanoid), stable across edits and unrelated
 * to the vCard `UID` in `data.uid` — that one is the *exported* identity and is
 * minted fresh by `generateVcf` when empty.
 *
 * `displayName` and `organization` are denormalized copies of fields inside
 * `data`, so the contact list can sort and search through indexes without
 * deserializing every row's payload. They are stamped by `ContactDBQueries`.
 */
export interface StoredContact {
  id: string;
  data: VCardData;
  displayName: string;
  organization: string;
  createdAt: Date;
  updatedAt: Date;
}
