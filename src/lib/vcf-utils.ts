import type {
  VCardAddress,
  VCardPhone,
  VCardEmail,
  VCardUrl,
  VCardImpp,
  VCardRelated,
  VCardData,
} from "@/types/vcard-types";
import { defaultVCardData } from "@/constants/vcard-constants";
import {
  PHONE_TYPE_KEYWORDS,
  IMPP_TYPE_KEYWORDS,
  URL_TYPE_KEYWORDS,
  RELATED_TYPE_KEYWORDS,
} from "@/constants/vcard-type-patterns";

export function parseVcf(vcfString: string): VCardData {
  const data: VCardData = JSON.parse(JSON.stringify(defaultVCardData));

  // Clear default arrays for fresh import
  data.emails = [];
  data.phones = [];
  data.addresses = [];
  data.urls = [];
  data.impps = [];
  data.related = [];
  data.customFields = [];

  const lines = unfoldLines(vcfString);

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const rawKey = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1).trim();
    const key = rawKey.split(";")[0].toUpperCase();
    const params = rawKey.toUpperCase();

    switch (key) {
      case "N": {
        const parts = value.split(";");
        data.lastName = unescapeValue(parts[0] || "");
        data.firstName = unescapeValue(parts[1] || "");
        data.middleName = unescapeValue(parts[2] || "");
        data.prefix = unescapeValue(parts[3] || "");
        data.suffix = unescapeValue(parts[4] || "");
        break;
      }
      case "NICKNAME":
        data.nickname = unescapeValue(value);
        break;
      case "PHOTO":
        data.photo = value;
        break;
      case "BDAY":
        data.birthday = formatDateForInput(value);
        break;
      case "ANNIVERSARY":
        data.anniversary = formatDateForInput(value);
        break;
      case "GENDER":
        data.gender = value.charAt(0).toUpperCase() as VCardData["gender"];
        break;
      case "ORG": {
        const orgParts = value.split(";");
        data.organization = unescapeValue(orgParts[0] || "");
        data.department = unescapeValue(orgParts.slice(1).join(", "));
        break;
      }
      case "TITLE":
        data.title = unescapeValue(value);
        break;
      case "ROLE":
        data.role = unescapeValue(value);
        break;
      case "LOGO":
        data.logo = value;
        break;
      case "EMAIL": {
        const emailType = getTypeFromParams(params, [
          "work",
          "home",
          "other",
        ]) as VCardEmail["type"];
        data.emails.push({ type: emailType, value: unescapeValue(value) });
        break;
      }
      case "TEL": {
        const phoneType = getPhoneType(params);
        data.phones.push({ type: phoneType, value: unescapeValue(value) });
        break;
      }
      case "IMPP": {
        const imppType = getImppType(params, value);
        data.impps.push({ type: imppType, value: unescapeValue(value) });
        break;
      }
      case "ADR": {
        const addrType = getTypeFromParams(params, [
          "work",
          "home",
          "other",
        ]) as VCardAddress["type"];
        const addrParts = value.split(";");
        data.addresses.push({
          type: addrType,
          poBox: unescapeValue(addrParts[0] || ""),
          extendedAddress: unescapeValue(addrParts[1] || ""),
          street: unescapeValue(addrParts[2] || ""),
          city: unescapeValue(addrParts[3] || ""),
          state: unescapeValue(addrParts[4] || ""),
          postalCode: unescapeValue(addrParts[5] || ""),
          country: unescapeValue(addrParts[6] || ""),
        });
        break;
      }
      case "URL": {
        const urlType = getUrlType(params);
        data.urls.push({ type: urlType, value: unescapeValue(value) });
        break;
      }
      case "GEO":
        data.geo = value.replace("geo:", "");
        break;
      case "TZ":
        data.timezone = value;
        break;
      case "CATEGORIES":
        data.categories = unescapeValue(value);
        break;
      case "NOTE":
        data.note = unescapeValue(value);
        break;
      case "PRODID":
        data.prodid = value;
        break;
      case "REV":
        data.rev = value;
        break;
      case "UID":
        data.uid = value;
        break;
      case "CALURI":
        data.calendarUri = value;
        break;
      case "CALADRURI":
        data.calendarAddressUri = value;
        break;
      case "FBURL":
        data.freeBusyUrl = value;
        break;
      case "KEY":
        data.publicKey = value;
        break;
      case "RELATED": {
        const relType = getRelatedType(params);
        data.related.push({ type: relType, value: unescapeValue(value) });
        break;
      }
      case "LANG":
        data.languages = data.languages ? `${data.languages}, ${value}` : value;
        break;
      default:
        if (key.startsWith("X-")) {
          data.customFields.push({ key: key, value: unescapeValue(value) });
        }
        break;
    }
  }

  // Ensure at least one entry in arrays
  if (data.emails.length === 0) data.emails = [{ type: "home", value: "" }];
  if (data.phones.length === 0) data.phones = [{ type: "cell", value: "" }];
  if (data.addresses.length === 0)
    data.addresses = [
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
    ];
  if (data.urls.length === 0) data.urls = [{ type: "homepage", value: "" }];

  return data;
}

// Unfold continuation lines (lines starting with space/tab are continuations)
function unfoldLines(vcf: string): string[] {
  return vcf
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
}

function unescapeValue(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function escapeValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatDateForInput(value: string): string {
  // Handle various date formats: YYYYMMDD, YYYY-MM-DD, --MMDD
  const clean = value.replace(/-/g, "");
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  return value;
}

function formatDateForVcf(value: string): string {
  return value.replace(/-/g, "");
}

function getTypeFromParams(params: string, validTypes: string[]): string {
  for (const type of validTypes) {
    if (params.includes(type.toUpperCase())) return type;
  }
  return validTypes[validTypes.length - 1]; // default to last (usually "other")
}

function getPhoneType(params: string): VCardPhone["type"] {
  const upperParams = params.toUpperCase();
  for (const [keyword, type] of Object.entries(PHONE_TYPE_KEYWORDS)) {
    if (upperParams.includes(keyword)) return type;
  }
  return "other";
}

function getImppType(params: string, value: string): VCardImpp["type"] {
  const combined = (params + value).toUpperCase();
  for (const [keyword, type] of Object.entries(IMPP_TYPE_KEYWORDS)) {
    if (combined.includes(keyword)) return type;
  }
  return "other";
}

function getUrlType(params: string): VCardUrl["type"] {
  const upperParams = params.toUpperCase();
  for (const [keyword, type] of Object.entries(URL_TYPE_KEYWORDS)) {
    if (upperParams.includes(keyword)) return type;
  }
  return "homepage";
}

function getRelatedType(params: string): VCardRelated["type"] {
  const upperParams = params.toUpperCase();
  for (const [keyword, type] of Object.entries(RELATED_TYPE_KEYWORDS)) {
    if (upperParams.includes(keyword)) return type;
  }
  return "other";
}

// ...

export function generateVcf(
  data: VCardData,
  version: "3.0" | "4.0" = "4.0"
): string {
  const lines: string[] = ["BEGIN:VCARD", `VERSION:${version}`];

  // ...
  // Full Name (required in 3.0 and 4.0)
  const fullName = [
    data.prefix,
    data.firstName,
    data.middleName,
    data.lastName,
    data.suffix,
  ]
    .filter(Boolean)
    .join(" ");
  lines.push(`FN:${escapeValue(fullName || "Unnamed")}`);

  // Structured Name
  lines.push(
    `N:${escapeValue(data.lastName)};${escapeValue(
      data.firstName
    )};${escapeValue(data.middleName)};${escapeValue(
      data.prefix
    )};${escapeValue(data.suffix)}`
  );

  if (data.nickname) lines.push(`NICKNAME:${escapeValue(data.nickname)}`);

  if (data.photo) {
    if (data.photo.startsWith("data:") || data.photo.startsWith("http")) {
      lines.push(
        version === "4.0"
          ? `PHOTO:${data.photo}`
          : `PHOTO;VALUE=URI:${data.photo}`
      );
    } else {
      lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${data.photo}`);
    }
  }

  if (data.birthday) lines.push(`BDAY:${formatDateForVcf(data.birthday)}`);
  if (data.anniversary)
    lines.push(`ANNIVERSARY:${formatDateForVcf(data.anniversary)}`);
  if (data.gender) lines.push(`GENDER:${data.gender}`);

  // Organization
  if (data.organization || data.department) {
    const org = data.department
      ? `${escapeValue(data.organization)};${escapeValue(data.department)}`
      : escapeValue(data.organization);
    lines.push(`ORG:${org}`);
  }
  if (data.title) lines.push(`TITLE:${escapeValue(data.title)}`);
  if (data.role) lines.push(`ROLE:${escapeValue(data.role)}`);
  if (data.logo) lines.push(`LOGO:${data.logo}`);

  // Emails
  for (const email of data.emails) {
    if (email.value) {
      const typeParam =
        version === "4.0"
          ? `TYPE=${email.type}`
          : `TYPE=INTERNET,${email.type.toUpperCase()}`;
      lines.push(`EMAIL;${typeParam}:${email.value}`);
    }
  }

  // Phones
  for (const phone of data.phones) {
    if (phone.value) {
      const typeParam =
        phone.type === "cell" ? "CELL" : phone.type.toUpperCase();
      lines.push(`TEL;TYPE=${typeParam}:${phone.value}`);
    }
  }

  // Instant Messaging
  for (const impp of data.impps) {
    if (impp.value) {
      const prefix = impp.type === "other" ? "" : `${impp.type}:`;
      lines.push(`IMPP:${prefix}${impp.value}`);
    }
  }

  // Addresses
  for (const addr of data.addresses) {
    if (
      addr.street ||
      addr.city ||
      addr.state ||
      addr.postalCode ||
      addr.country
    ) {
      lines.push(
        `ADR;TYPE=${addr.type}:${escapeValue(addr.poBox)};${escapeValue(
          addr.extendedAddress
        )};${escapeValue(addr.street)};${escapeValue(addr.city)};${escapeValue(
          addr.state
        )};${escapeValue(addr.postalCode)};${escapeValue(addr.country)}`
      );
    }
  }

  // URLs
  for (const url of data.urls) {
    if (url.value) {
      lines.push(`URL;TYPE=${url.type}:${url.value}`);
    }
  }

  // Geographic
  if (data.geo) {
    lines.push(
      version === "4.0"
        ? `GEO:geo:${data.geo}`
        : `GEO:${data.geo.replace(",", ";")}`
    );
  }
  if (data.timezone) lines.push(`TZ:${data.timezone}`);

  // Categories
  if (data.categories) lines.push(`CATEGORIES:${escapeValue(data.categories)}`);

  // Note
  if (data.note) lines.push(`NOTE:${escapeValue(data.note)}`);

  // Calendar
  if (data.calendarUri) lines.push(`CALURI:${data.calendarUri}`);
  if (data.calendarAddressUri)
    lines.push(`CALADRURI:${data.calendarAddressUri}`);
  if (data.freeBusyUrl) lines.push(`FBURL:${data.freeBusyUrl}`);

  // Related
  for (const rel of data.related) {
    if (rel.value) {
      lines.push(`RELATED;TYPE=${rel.type}:${escapeValue(rel.value)}`);
    }
  }

  // Languages
  if (data.languages) {
    for (const lang of data.languages
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean)) {
      lines.push(`LANG:${lang}`);
    }
  }

  // Security
  if (data.publicKey) lines.push(`KEY:${data.publicKey}`);

  // Custom fields
  for (const field of data.customFields) {
    if (field.key && field.value) {
      lines.push(`${field.key}:${escapeValue(field.value)}`);
    }
  }

  // UID
  if (data.uid) {
    lines.push(`UID:${data.uid}`);
  } else {
    lines.push(`UID:urn:uuid:${crypto.randomUUID()}`);
  }

  // Revision timestamp
  lines.push(
    `REV:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`
  );

  // Product ID
  lines.push(`PRODID:-//vCard Editor//v0//EN`);

  lines.push("END:VCARD");

  // Fold long lines (max 75 characters per RFC)
  return lines.map(foldLine).join("\r\n");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  let first = true;
  while (remaining.length > 0) {
    const maxLen = first ? 75 : 74; // continuation lines start with space
    parts.push((first ? "" : " ") + remaining.slice(0, maxLen));
    remaining = remaining.slice(maxLen);
    first = false;
  }
  return parts.join("\r\n");
}

export function downloadVcf(data: VCardData, version: "3.0" | "4.0" = "4.0") {
  const vcfContent = generateVcf(data, version);
  const blob = new Blob([vcfContent], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileName =
    [data.firstName, data.lastName].filter(Boolean).join("_") || "contact";
  link.href = url;
  link.download = `${fileName}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
