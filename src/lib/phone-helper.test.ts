import { describe, expect, it } from "vitest";
import {
  splitPhoneNumber,
  extractCountryCode,
  formatPhoneNumber,
  addCountryCode,
  hasCountryCode,
} from "./phone-helper";

describe("splitPhoneNumber", () => {
  it("splits a Venezuela country code (+58) and local number", () => {
    const result = splitPhoneNumber("+584121111111");
    expect(result).toEqual({
      countryCode: "+58",
      localNumber: "4121111111",
    });
  });

  it("splits a US country code (+1) with formatted local number", () => {
    const result = splitPhoneNumber("+1 (555) 123-4567");
    expect(result).toEqual({
      countryCode: "+1",
      localNumber: "(555) 123-4567",
    });
  });

  it("splits a Spain country code (+34) with spaces", () => {
    const result = splitPhoneNumber("+34 612 34 56 78");
    expect(result).toEqual({
      countryCode: "+34",
      localNumber: "612 34 56 78",
    });
  });

  it("returns empty countryCode for numbers without leading +", () => {
    const result = splitPhoneNumber("555 123 4567");
    expect(result).toEqual({
      countryCode: "",
      localNumber: "555 123 4567",
    });
  });

  it("returns empty values for empty strings", () => {
    const result = splitPhoneNumber("");
    expect(result).toEqual({
      countryCode: "",
      localNumber: "",
    });
  });
});

describe("extractCountryCode", () => {
  it("extracts country code when present", () => {
    expect(extractCountryCode("+584121111111")).toBe("+58");
    expect(extractCountryCode("+15551234567")).toBe("+1");
  });

  it("returns null when no country code is present", () => {
    expect(extractCountryCode("5551234567")).toBeNull();
  });
});
