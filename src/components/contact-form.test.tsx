import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { defaultVCardData } from "@/constants/vcard-constants";
import type { VCardData } from "@/types/vcard-types";
import { PhonesField } from "./contact-form";

function TestWrapper({
  children,
  defaultValues = JSON.parse(JSON.stringify(defaultVCardData)),
}: {
  children: React.ReactNode;
  defaultValues?: VCardData;
}) {
  const methods = useForm<VCardData>({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

function makeDataWithPhones(
  phones: VCardData["phones"]
): VCardData {
  return {
    ...JSON.parse(JSON.stringify(defaultVCardData)),
    phones,
  };
}

describe("PhonesField pref star", () => {
  it("sets pref=true on the clicked phone and clears other phones", async () => {
    const user = userEvent.setup();
    const data = makeDataWithPhones([
      { type: "cell", value: "555-1111" },
      { type: "home", value: "555-2222" },
    ]);

    render(
      <TestWrapper defaultValues={data}>
        <PhonesField />
      </TestWrapper>
    );

    const stars = screen.getAllByRole("button", { name: /preferred/i });
    expect(stars.length).toBe(2);

    await user.click(stars[0]);
    await user.click(stars[1]);

    const hiddenInputs = document.querySelectorAll('input[name$=".pref"]');
    const phonePrefs = Array.from(hiddenInputs)
      .filter((input) => input.getAttribute("name")?.startsWith("phones."))
      .map((input) => (input as HTMLInputElement).value);

    expect(phonePrefs[0]).toBe("false");
    expect(phonePrefs[1]).toBe("true");
  });

  it("unselects the active star when clicked again", async () => {
    const user = userEvent.setup();
    const data = makeDataWithPhones([
      { type: "cell", value: "555-1111" },
    ]);

    render(
      <TestWrapper defaultValues={data}>
        <PhonesField />
      </TestWrapper>
    );

    const stars = screen.getAllByRole("button", { name: /preferred/i });
    await user.click(stars[0]);
    await user.click(stars[0]);

    const hiddenInputs = document.querySelectorAll('input[name$=".pref"]');
    const phonePrefs = Array.from(hiddenInputs)
      .filter((input) => input.getAttribute("name")?.startsWith("phones."))
      .map((input) => (input as HTMLInputElement).value);

    expect(phonePrefs[0]).toBe("false");
  });
});
