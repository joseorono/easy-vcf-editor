import { db } from "@/db/main";
import { nanoidContactId } from "@/constants/nanoid";
import { CONTACT_FALLBACK_DISPLAY_NAME } from "@/constants/contacts";
import { buildFullName, createBlankVCardData } from "@/lib/vcf-utils";
import type { StoredContact } from "@/types/contact-db";
import type { VCardData } from "@/types/vcard-types";

/**
 * All IndexedDB access for contacts.
 *
 * Components never touch `db.contacts` directly, so ids, timestamps and the
 * denormalized index columns stay correct by construction. Callers only ever
 * hand over a `VCardData`.
 */
export class ContactDBQueries {
  /** Derives the denormalized index columns from a contact payload. */
  private static deriveIndexFields(data: VCardData) {
    const displayName =
      buildFullName(data) ||
      data.nickname ||
      data.emails?.find((email) => email.value)?.value ||
      CONTACT_FALLBACK_DISPLAY_NAME;

    return { displayName, organization: data.organization ?? "" };
  }

  /** Most recently edited first. */
  static async getAllContacts(): Promise<StoredContact[]> {
    return db.contacts.orderBy("updatedAt").reverse().toArray();
  }

  static async getContactById(id: string): Promise<StoredContact | undefined> {
    return db.contacts.get(id);
  }

  /** Inserts a contact and returns its new id. */
  static async insertContact(data: VCardData): Promise<string> {
    const now = new Date();
    const id = nanoidContactId();

    await db.contacts.add({
      id,
      data,
      ...this.deriveIndexFields(data),
      createdAt: now,
      updatedAt: now,
    });

    return id;
  }

  static async updateContact(id: string, data: VCardData): Promise<void> {
    await db.contacts.update(id, {
      data,
      ...this.deriveIndexFields(data),
      updatedAt: new Date(),
    });
  }

  /**
   * Force-import: fully replaces an existing contact in place by primary key.
   *
   * Reads the existing row inside a read/write transaction to capture its
   * `createdAt`, then overwrites the whole record via `put` — reusing the
   * existing `id`, overwriting `data` and the denormalized index columns (no
   * field merging), preserving the original `createdAt`, and bumping
   * `updatedAt` to now so the replaced contact surfaces as recently edited
   * without jumping to the top as newly created.
   *
   * Silently no-ops when `existingId` is no longer in the library — the
   * collision that the caller is acting on may point at a row that was
   * concurrently deleted, and the import should not mint a fresh record.
   *
   * Chained deliberately instead of `async/await`: Dexie tracks the active
   * transaction through its own promise implementation, and a native `await`
   * inside the callback drops that zone and commits the transaction early
   * (see {@link ensureSeedContact} for the same pattern).
   */
  static async replaceContact(existingId: string, data: VCardData): Promise<void> {
    return db.transaction("rw", db.contacts, () =>
      db.contacts.get(existingId).then((existing) => {
        if (!existing) return undefined;
        return db.contacts.put({
          id: existingId,
          data,
          ...this.deriveIndexFields(data),
          createdAt: existing.createdAt,
          updatedAt: new Date(),
        }).then(() => undefined);
      })
    );
  }

  static async deleteContact(id: string): Promise<void> {
    await db.contacts.delete(id);
  }

  /** Bulk import of a multi-contact `.vcf`. Returns the new ids, in order. */
  static async bulkInsertContacts(list: VCardData[]): Promise<string[]> {
    const now = new Date();
    const rows = list.map((data) => ({
      id: nanoidContactId(),
      data,
      ...this.deriveIndexFields(data),
      createdAt: now,
      updatedAt: now,
    }));

    await db.contacts.bulkAdd(rows);

    return rows.map((row) => row.id);
  }

  /**
   * Guarantees the library holds at least one contact, returning the id to
   * select — the most recently edited one, or a fresh blank contact when the
   * library is empty.
   *
   * The read and the insert share a transaction so concurrent callers can't
   * both decide the library is empty and each insert a blank contact. That
   * happens in practice: React StrictMode runs mount effects twice in dev.
   */
  static async ensureSeedContact(): Promise<string> {
    // Chained deliberately instead of async/await: Dexie tracks the active
    // transaction through its own promise implementation, and native await
    // inside the callback drops that zone and commits the transaction early.
    return db.transaction("rw", db.contacts, () =>
      db.contacts
        .orderBy("updatedAt")
        .reverse()
        .first()
        .then((mostRecent) => {
          if (mostRecent) return mostRecent.id;

          const now = new Date();
          const id = nanoidContactId();
          const data = createBlankVCardData();

          return db.contacts
            .add({
              id,
              data,
              ...this.deriveIndexFields(data),
              createdAt: now,
              updatedAt: now,
            })
            .then(() => id);
        })
    );
  }

  static async clearAll(): Promise<void> {
    return db.contacts.clear();
  }

  static async count(): Promise<number> {
    return db.contacts.count();
  }
}
