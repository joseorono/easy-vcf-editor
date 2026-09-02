import { customAlphabet } from "nanoid";

export const CONTACT_ID_LENGTH = 12;

// URL-safe alphanumeric (no `_` or `-`), so ids stay safe in future deep links.
export const ID_DICTIONARY =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const nanoidContactId = customAlphabet(ID_DICTIONARY, CONTACT_ID_LENGTH);
