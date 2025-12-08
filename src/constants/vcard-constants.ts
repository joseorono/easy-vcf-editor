import type {
  VCardAddress,
  VCardPhone,
  VCardEmail,
  VCardUrl,
  VCardImpp,
  VCardRelated,
  VCardData,
} from "@/types/vcard-types"

export const defaultVCardData: VCardData = {
  firstName: "",
  lastName: "",
  middleName: "",
  prefix: "",
  suffix: "",
  nickname: "",
  photo: "",
  birthday: "",
  anniversary: "",
  gender: "",
  organization: "",
  department: "",
  title: "",
  role: "",
  logo: "",
  emails: [{ type: "home", value: "" }],
  phones: [{ type: "cell", value: "" }],
  impps: [],
  addresses: [
    {
      type: "home",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      poBox: "",
      extendedAddress: "",
    },
  ],
  urls: [{ type: "homepage", value: "" }],
  geo: "",
  timezone: "",
  categories: "",
  note: "",
  prodid: "",
  rev: "",
  uid: "",
  calendarUri: "",
  calendarAddressUri: "",
  freeBusyUrl: "",
  publicKey: "",
  related: [],
  languages: "",
  customFields: [],
}

export const genderLabels: Record<string, string> = {
  "": "Not specified",
  M: "Male",
  F: "Female",
  O: "Other",
  N: "None/Not applicable",
  U: "Unknown",
}

export const phoneTypeLabels: Record<VCardPhone["type"], string> = {
  home: "Home",
  work: "Work",
  cell: "Mobile",
  fax: "Fax",
  pager: "Pager",
  other: "Other",
}

export const emailTypeLabels: Record<VCardEmail["type"], string> = {
  home: "Personal",
  work: "Work",
  other: "Other",
}

export const addressTypeLabels: Record<VCardAddress["type"], string> = {
  home: "Home",
  work: "Work",
  other: "Other",
}

export const urlTypeLabels: Record<VCardUrl["type"], string> = {
  homepage: "Homepage",
  work: "Work",
  blog: "Blog",
  profile: "Profile",
  other: "Other",
}

export const imppTypeLabels: Record<VCardImpp["type"], string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  signal: "Signal",
  discord: "Discord",
  matrix: "Matrix",
  mastodon: "Mastodon",
  bluesky: "Bluesky",
  other: "Other",
};

export const relatedTypeLabels: Record<VCardRelated["type"], string> = {
  spouse: "Spouse",
  child: "Child",
  parent: "Parent",
  sibling: "Sibling",
  friend: "Friend",
  colleague: "Colleague",
  assistant: "Assistant",
  emergency: "Emergency Contact",
  other: "Other",
}
