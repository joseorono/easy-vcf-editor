import type { VCardData } from "@/types/vcard-types";
import type { StoredContact } from "@/types/contact-db";
import { normalizePhoneNumber } from "@/lib/phone-helper";

/**
 * Outcome of one incoming contact's match against the existing library.
 *
 * The collision always points at a single existing row. When an incoming
 * contact matches more than one existing contact, the matcher picks the
 * oldest one (see {@link findDuplicates} for the tie-break rules) and only
 * that id surfaces here.
 */
export interface DuplicateHit {
  /** The incoming contact that collided. */
  incoming: VCardData;
  /** Id of the existing `StoredContact` it matched against (first wins). */
  existingId: string;
}

/**
 * Partitioning of an import batch against the existing library.
 *
 * `unique` and `duplicates` together hold every incoming contact in input
 * order — each incoming contact lands in exactly one of the two buckets.
 */
export interface DuplicateResult {
  /** Incoming contacts with no match against the existing library. */
  unique: VCardData[];
  /** Incoming contacts that matched an existing row, in input order. */
  duplicates: DuplicateHit[];
}

/**
 * Normalize an email for comparison.
 *
 * Trims surrounding whitespace, lowercases, and strips a leading `mailto:`
 * prefix (case-insensitive). Empty or whitespace-only input yields an empty
 * string and never throws — callers can compare any value through this
 * helper, even malformed ones.
 */
export function normalizeEmail(email: string): string {
  if (!email) return "";
  const trimmed = email.trim().toLowerCase();
  const withoutMailto = trimmed.replace(/^mailto:/, "");
  return withoutMailto.trim();
}

/** Lowercases and trims a name component. Empty input yields "". */
function normalizeName(name: string): string {
  return (name ?? "").trim().toLowerCase();
}

/**
 * Normalized full-name key used for comparison: `firstName` and `lastName`
 * are normalized individually (trim + lowercase) and joined with a single
 * space, so extra internal whitespace never leaks into the key. Empty parts
 * are dropped; a contact with no name parts at all yields "".
 */
function normalizeFullName(
  data: Pick<VCardData, "firstName" | "lastName">
): string {
  return [normalizeName(data.firstName), normalizeName(data.lastName)]
    .filter(Boolean)
    .join(" ");
}

/** Returns only non-empty, whitespace-trimmed strings. */
function presentValues(values: string[] | undefined): string[] {
  return (values ?? []).map((v) => (v ?? "").trim()).filter((v) => v !== "");
}

/**
 * True iff incoming and existing share at least one normalized email.
 *
 * Returns false when either side has no non-empty emails — the spec requires
 * the matcher to only compare a field when it is present on BOTH sides.
 */
function matchesEmail(incoming: VCardData, existing: StoredContact): boolean {
  const incomingEmails = presentValues((incoming.emails ?? []).map((e) => e.value));
  const existingEmails = presentValues(
    (existing.data.emails ?? []).map((e) => e.value)
  );
  if (incomingEmails.length === 0 || existingEmails.length === 0) return false;

  const existingSet = new Set(existingEmails.map(normalizeEmail));
  return incomingEmails.some((e) => existingSet.has(normalizeEmail(e)));
}

/**
 * True iff both sides carry a non-empty `uid` and the values are equal after
 * trimming.
 *
 * The vCard `UID` property is the exporter's stable identity for a contact,
 * so a shared UID is a near-certain duplicate even when every other field
 * differs. Comparison is exact (case-sensitive) apart from trimming: UIDs
 * are opaque identifiers (URNs, UUIDs, hashes), not human text, and case
 * folding an opaque ID risks false positives.
 */
function matchesUid(incoming: VCardData, existing: StoredContact): boolean {
  const incomingUid = (incoming.uid ?? "").trim();
  const existingUid = (existing.data.uid ?? "").trim();
  if (!incomingUid || !existingUid) return false;
  return incomingUid === existingUid;
}

/**
 * True iff incoming and existing share the same normalized full name AND at
 * least one phone number (after normalization).
 *
 * The name is compared as a single full-name key — `firstName` and `lastName`
 * normalized and joined — rather than requiring both parts separately.
 * Minimal exports (e.g. messaging apps) often carry a single-part name in
 * `FN:` with no structured `N:`, which would leave `lastName` empty and fail
 * a per-part comparison. The joined key also matches the same name split
 * differently between `FN:`/`N:` across exports. The shared phone remains
 * the strong disambiguator, keeping the false-positive risk negligible.
 *
 * Returns false when either full name is empty, or when either side has no
 * non-empty phones.
 */
function matchesNamePlusPhone(incoming: VCardData, existing: StoredContact): boolean {
  const incomingName = normalizeFullName(incoming);
  const existingName = normalizeFullName(existing.data);

  if (!incomingName || !existingName || incomingName !== existingName) {
    return false;
  }

  const incomingPhones = presentValues((incoming.phones ?? []).map((p) => p.value));
  const existingPhones = presentValues(
    (existing.data.phones ?? []).map((p) => p.value)
  );
  if (incomingPhones.length === 0 || existingPhones.length === 0) return false;

  const existingSet = new Set(existingPhones.map(normalizePhoneNumber));
  return incomingPhones.some((p) => existingSet.has(normalizePhoneNumber(p)));
}

/**
 * Compare a batch of incoming contacts against the existing library and
 * partition it into `unique` (no match) and `duplicates` (matched one
 * existing row).
 *
 * A contact is a duplicate of an existing row when, after normalization, it
 * shares a non-empty `uid`, OR shares at least one email, OR shares the same
 * full name (first and last joined) AND at least one phone. The matcher
 * performs no other matching (no organization, no address).
 *
 * Behavior contract (per `duplicate-detection` spec):
 * - Pure: no inputs are mutated, no I/O is performed, no React dependency.
 * - Deterministic tie-break: the `existing` array is sorted by `createdAt`
 *   ascending and then by `id` ascending before scanning. For each incoming
 *   contact, the FIRST existing row that matches “wins” the collision. This
 *   makes the oldest definition of a contact the canonical reference, and
 *   `id` asc guarantees a total order even when `createdAt` clashes (e.g.
 *   bulk-imported rows stamped with the same `Date`).
 * - Iterates incoming contacts in input order, so intra-file duplicates are
 *   each compared independently against the library (the matcher never
 *   cross-compares the incoming batch against itself).
 * - Never throws when `uid`, `emails`, `phones`, `firstName`, or `lastName`
 *   are absent/empty on either side — it simply skips any rule that needs
 *   the missing field.
 *
 * @param incoming - Parsed contacts the user is importing.
 * @param existing - All contacts currently in the library. May be empty.
 * @returns `{ unique, duplicates }` partition of the incoming batch.
 */
export function findDuplicates(
  incoming: VCardData[],
  existing: StoredContact[]
): DuplicateResult {
  // Defensive copy + sort so the caller's array reference and order are not
  // touched — important for the "pure / no-mutation" contract above.
  const sortedExisting = [...existing].sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    if (aTime !== bTime) return aTime - bTime;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });

  const unique: VCardData[] = [];
  const duplicates: DuplicateHit[] = [];

  for (const contact of incoming) {
    let matchedId: string | null = null;
    for (const ex of sortedExisting) {
      if (
        matchesUid(contact, ex) ||
        matchesEmail(contact, ex) ||
        matchesNamePlusPhone(contact, ex)
      ) {
        matchedId = ex.id;
        break;
      }
    }
    if (matchedId !== null) {
      duplicates.push({ incoming: contact, existingId: matchedId });
    } else {
      unique.push(contact);
    }
  }

  return { unique, duplicates };
}