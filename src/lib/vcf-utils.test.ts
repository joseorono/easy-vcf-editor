import { describe, expect, it } from "vitest";
import { defaultVCardData } from "@/constants/vcard-constants";
import type { VCardData } from "@/types/vcard-types";
import { generateVcf, parseVcf } from "./vcf-utils";

function makeData(overrides: Partial<VCardData> = {}): VCardData {
  return {
    ...JSON.parse(JSON.stringify(defaultVCardData)),
    ...overrides,
  };
}

describe("generateVcf PREF parameter", () => {
  it("appends PREF=1 to a preferred phone", () => {
    const data = makeData({
      phones: [{ type: "cell", value: "555-1234", pref: true }],
    });
    const vcf = generateVcf(data, "3.0");
    expect(vcf).toContain("TEL;TYPE=CELL;PREF=1:555-1234");
  });

  it("appends PREF=1 to a preferred email", () => {
    const data = makeData({
      emails: [{ type: "work", value: "jane@acme.com", pref: true }],
    });
    const vcf = generateVcf(data, "4.0");
    expect(vcf).toContain("EMAIL;TYPE=work;PREF=1:jane@acme.com");
  });

  it("appends PREF=1 to a preferred address", () => {
    const data = makeData({
      addresses: [
        {
          type: "home",
          street: "123 Main St",
          city: "Springfield",
          state: "IL",
          postalCode: "62701",
          country: "USA",
          poBox: "",
          extendedAddress: "",
          pref: true,
        },
      ],
    });
    const vcf = generateVcf(data, "3.0");
    expect(vcf).toContain("ADR;TYPE=home;PREF=1");
  });

  it("does not include PREF when pref is false or undefined", () => {
    const data = makeData({
      phones: [{ type: "home", value: "555-0000" }],
      emails: [{ type: "home", value: "a@b.com", pref: false }],
    });
    const vcf = generateVcf(data, "3.0");
    expect(vcf).not.toContain("PREF");
  });

  it("appends PREF=1 to v3.0 email type params", () => {
    const data = makeData({
      emails: [{ type: "work", value: "x@y.com", pref: true }],
    });
    const vcf = generateVcf(data, "3.0");
    expect(vcf).toContain("EMAIL;TYPE=INTERNET,WORK;PREF=1:x@y.com");
  });
});

describe("parseVcf PREF detection", () => {
  it("detects PREF=1 on a TEL entry", () => {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:Jane\nTEL;TYPE=CELL;PREF=1:555-9999\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.phones[0]).toMatchObject({
      type: "cell",
      value: "555-9999",
      pref: true,
    });
  });

  it("detects PREF=1 on an EMAIL entry", () => {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:Jane\nEMAIL;TYPE=WORK;PREF=1:jane@acme.com\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.emails[0]).toMatchObject({
      type: "work",
      value: "jane@acme.com",
      pref: true,
    });
  });

  it("detects PREF=1 on an ADR entry", () => {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:Jane\nADR;TYPE=HOME;PREF=1:;;123 Main St;Springfield;IL;62701;USA\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.addresses[0]).toMatchObject({
      type: "home",
      street: "123 Main St",
      pref: true,
    });
  });

  it("keeps only the last PREF when multiple entries are marked", () => {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:Jane\nEMAIL;TYPE=WORK;PREF=1:a@b.com\nEMAIL;TYPE=HOME;PREF=1:c@d.com\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.emails[0].pref).toBe(false);
    expect(parsed.emails[1].pref).toBe(true);
  });

  it("sets pref to false when no PREF is present", () => {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:Jane\nTEL;TYPE=CELL:555-0000\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.phones[0].pref).toBe(false);
  });
});

describe("parseVcf inline image normalization", () => {
  it("wraps ENCODING=b base64 PHOTO as a data URI using the TYPE param", () => {
    const vcf = `BEGIN:VCARD\nVERSION:4.0\nFN:Jane\nPHOTO;ENCODING=b;TYPE=JPEG:iVBORw0KGgoAAAANSUhE\n UgAAAIAAAACACAYAAADD\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.photo).toBe(
      "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADD"
    );
  });

  it("uses image/png for TYPE=PNG on LOGO", () => {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:Jane\nLOGO;ENCODING=BASE64;TYPE=PNG:aGVsbG8=\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.logo).toBe("data:image/png;base64,aGVsbG8=");
  });

  it("defaults to image/jpeg when no TYPE param is present", () => {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:Jane\nPHOTO;ENCODING=b:aGVsbG8=\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.photo).toBe("data:image/jpeg;base64,aGVsbG8=");
  });

  it("passes data: URIs through untouched", () => {
    const uri = "data:image/png;base64,aGVsbG8=";
    const vcf = `BEGIN:VCARD\nVERSION:4.0\nFN:Jane\nPHOTO:${uri}\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.photo).toBe(uri);
  });

  it("passes http(s) URLs through untouched", () => {
    const url = "https://example.com/photo.jpg";
    const vcf = `BEGIN:VCARD\nVERSION:4.0\nFN:Jane\nPHOTO;VALUE=URI:${url}\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.photo).toBe(url);
  });
});

describe("parseVcf FN fallback", () => {
  it("splits FN into first/last name when N is absent", () => {
    const vcf = `BEGIN:VCARD\nVERSION:4.0\nFN:Jane van Doe\nEMAIL:jane@example.com\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.firstName).toBe("Jane");
    expect(parsed.lastName).toBe("van Doe");
  });

  it("uses only firstName for a single-word FN", () => {
    const vcf = `BEGIN:VCARD\nVERSION:4.0\nFN:Cher\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.firstName).toBe("Cher");
    expect(parsed.lastName).toBe("");
  });

  it("prefers N over FN when both are present", () => {
    const vcf = `BEGIN:VCARD\nVERSION:4.0\nFN:Display Name\nN:Doe;Jane;;;\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.firstName).toBe("Jane");
    expect(parsed.lastName).toBe("Doe");
  });
});

describe("parseVcf multi-contact files", () => {
  it("imports only the first vCard", () => {
    const vcf = [
      "BEGIN:VCARD",
      "VERSION:4.0",
      "FN:First Person",
      "N:Person;First;;;",
      "EMAIL:first@example.com",
      "END:VCARD",
      "BEGIN:VCARD",
      "VERSION:4.0",
      "FN:Second Person",
      "N:Person;Second;;;",
      "EMAIL:second@example.com",
      "TEL;TYPE=CELL:555-0002",
      "END:VCARD",
    ].join("\n");
    const parsed = parseVcf(vcf);
    expect(parsed.firstName).toBe("First");
    expect(parsed.emails).toHaveLength(1);
    expect(parsed.emails[0].value).toBe("first@example.com");
    expect(parsed.phones[0].value).toBe("");
  });
});

describe("parseVcf grouped properties", () => {
  it("parses item-group-prefixed properties (Apple/Google style)", () => {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:Jane\nitem1.EMAIL;TYPE=WORK:jane@acme.com\nitem2.URL:https://example.com\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.emails[0]).toMatchObject({
      type: "work",
      value: "jane@acme.com",
    });
    expect(parsed.urls[0].value).toBe("https://example.com");
  });
});

describe("parseVcf quoted-printable decoding", () => {
  it("decodes UTF-8 quoted-printable values", () => {
    const vcf = `BEGIN:VCARD\nVERSION:2.1\nN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:M=C3=BCller;J=C3=B6rg;;;\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.lastName).toBe("Müller");
    expect(parsed.firstName).toBe("Jörg");
  });

  it("decodes ISO-8859-1 quoted-printable values", () => {
    const vcf = `BEGIN:VCARD\nVERSION:2.1\nFN:Jane\nNOTE;CHARSET=ISO-8859-1;ENCODING=QUOTED-PRINTABLE:Caf=E9\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.note).toBe("Café");
  });

  it("joins quoted-printable soft line breaks", () => {
    const vcf = `BEGIN:VCARD\nVERSION:2.1\nFN:Jane\nNOTE;ENCODING=QUOTED-PRINTABLE:Hello=\nWorld\nEND:VCARD`;
    const parsed = parseVcf(vcf);
    expect(parsed.note).toBe("HelloWorld");
  });
});

describe("PREF round-trip", () => {
  it("preserves pref after export and re-import", () => {
    const data = makeData({
      firstName: "Jane",
      lastName: "Doe",
      phones: [
        { type: "cell", value: "555-1234" },
        { type: "home", value: "555-5678", pref: true },
      ],
    });
    const vcf = generateVcf(data, "3.0");
    const parsed = parseVcf(vcf);
    expect(parsed.phones[0].pref).toBe(false);
    expect(parsed.phones[1].pref).toBe(true);
  });
});
