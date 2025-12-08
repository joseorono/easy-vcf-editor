export interface VCardAddress {
  type: "home" | "work" | "other"
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  poBox: string
  extendedAddress: string
}

export interface VCardPhone {
  type: "home" | "work" | "cell" | "fax" | "pager" | "other"
  value: string
}

export interface VCardEmail {
  type: "home" | "work" | "other"
  value: string
}

export interface VCardUrl {
  type: "homepage" | "work" | "blog" | "profile" | "other"
  value: string
}

export interface VCardImpp {
  type:
    | "telegram"
    | "whatsapp"
    | "signal"
    | "discord"
    | "matrix"
    | "mastodon"
    | "bluesky"
    | "other";
  value: string;
}

export interface VCardRelated {
  type:
    | "spouse"
    | "child"
    | "parent"
    | "sibling"
    | "friend"
    | "colleague"
    | "assistant"
    | "emergency"
    | "other"
  value: string
}

export interface VCardData {
  // Identification
  firstName: string
  lastName: string
  middleName: string
  prefix: string
  suffix: string
  nickname: string
  photo: string
  birthday: string
  anniversary: string
  gender: "" | "M" | "F" | "O" | "N" | "U"

  // Organization
  organization: string
  department: string
  title: string
  role: string
  logo: string

  // Communications
  emails: VCardEmail[]
  phones: VCardPhone[]
  impps: VCardImpp[]

  // Addresses
  addresses: VCardAddress[]

  // URLs
  urls: VCardUrl[]

  // Geographic
  geo: string
  timezone: string

  // Explanatory
  categories: string
  note: string
  prodid: string
  rev: string
  uid: string

  // Calendar
  calendarUri: string
  calendarAddressUri: string
  freeBusyUrl: string

  // Security
  publicKey: string

  // Related
  related: VCardRelated[]

  // Language
  languages: string

  // Custom/Extended
  customFields: { key: string; value: string }[]
}
