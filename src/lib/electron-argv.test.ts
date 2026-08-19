import { describe, it, expect } from "vitest";
import { pickVcfArgvEntries } from "@/lib/electron-argv";

const EXE = "C:\\Program Files\\Easy vCard Manager\\Easy vCard Manager.exe";

describe("pickVcfArgvEntries", () => {
  it("returns an empty array when no vCard files are present", () => {
    expect(pickVcfArgvEntries([EXE], EXE)).toEqual([]);
    expect(pickVcfArgvEntries([EXE, "--hidden"], EXE)).toEqual([]);
  });

  it("returns a single .vcf path", () => {
    expect(pickVcfArgvEntries([EXE, "C:\\contacts.vcf"], EXE)).toEqual([
      "C:\\contacts.vcf",
    ]);
  });

  it("preserves spaces inside a path", () => {
    expect(
      pickVcfArgvEntries([EXE, "C:\\My Contacts\\John Doe.vcf"], EXE)
    ).toEqual(["C:\\My Contacts\\John Doe.vcf"]);
  });

  it("returns multiple vCard files while ignoring non-vCard entries", () => {
    const argv = [EXE, "a.vcf", "notes.txt", "b.vcard", "image.png"];
    expect(pickVcfArgvEntries(argv, EXE)).toEqual(["a.vcf", "b.vcard"]);
  });

  it("skips the executable path", () => {
    expect(pickVcfArgvEntries([EXE, "contact.vcf"], EXE)).toEqual([
      "contact.vcf",
    ]);
  });

  it("matches extensions case-insensitively", () => {
    expect(pickVcfArgvEntries([EXE, "Contacts.VCF", "X.VCard"], EXE)).toEqual([
      "Contacts.VCF",
      "X.VCard",
    ]);
  });

  it("skips non-vCard flags and arguments", () => {
    const argv = [EXE, "--open", "file.vcf", "--another=value", "file.vcard"];
    expect(pickVcfArgvEntries(argv, EXE)).toEqual(["file.vcf", "file.vcard"]);
  });
});
