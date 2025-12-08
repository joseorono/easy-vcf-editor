import type {
  VCardPhone,
  VCardImpp,
  VCardUrl,
  VCardRelated
} from "@/types/vcard-types";

export const PHONE_TYPE_KEYWORDS: Record<string, VCardPhone["type"]> = {
  "CELL": "cell",
  "MOBILE": "cell",
  "FAX": "fax",
  "PAGER": "pager",
  "WORK": "work",
  "HOME": "home",
};

export const IMPP_TYPE_KEYWORDS: Record<string, VCardImpp["type"]> = {
  "TELEGRAM": "telegram",
  "WHATSAPP": "whatsapp",
  "SIGNAL": "signal",
  "DISCORD": "discord",
  "MATRIX": "matrix",
  "MASTODON": "mastodon",
  "BLUESKY": "bluesky",
};

export const URL_TYPE_KEYWORDS: Record<string, VCardUrl["type"]> = {
  "WORK": "work",
  "BLOG": "blog",
  "PROFILE": "profile",
};

export const RELATED_TYPE_KEYWORDS: Record<string, VCardRelated["type"]> = {
  "SPOUSE": "spouse",
  "CHILD": "child",
  "PARENT": "parent",
  "SIBLING": "sibling",
  "FRIEND": "friend",
  "COLLEAGUE": "colleague",
  "ASSISTANT": "assistant",
  "EMERGENCY": "emergency",
};
