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
