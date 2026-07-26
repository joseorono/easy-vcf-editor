import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultVCardData } from "@/constants/vcard-constants";
import type { VCardData } from "@/types/vcard-types";
import { GeoInput } from "./geo-input";

let methods: UseFormReturn<VCardData>;

function TestWrapper() {
  methods = useForm<VCardData>({
    defaultValues: JSON.parse(JSON.stringify(defaultVCardData)),
  });
  return (
    <FormProvider {...methods}>
      <GeoInput />
    </FormProvider>
  );
}

const latInput = () => screen.getByLabelText("Latitude") as HTMLInputElement;
const lngInput = () => screen.getByLabelText("Longitude") as HTMLInputElement;

// Auto-cleanup needs vitest `globals: true`, which this project doesn't
// enable — without this, renders leak across tests within the file.
afterEach(cleanup);

describe("GeoInput form-state sync", () => {
  it("populates lat/lng when geo is set externally (import)", () => {
    render(<TestWrapper />);

    act(() => {
      methods.reset({ ...methods.getValues(), geo: "10.5,-66.9" });
    });

    expect(latInput().value).toBe("10.5");
    expect(lngInput().value).toBe("-66.9");
  });

  it("clears lat/lng when the form is reset to defaults (clear)", () => {
    render(<TestWrapper />);

    act(() => {
      methods.reset({ ...methods.getValues(), geo: "10.5,-66.9" });
    });
    act(() => {
      methods.reset(JSON.parse(JSON.stringify(defaultVCardData)));
    });

    expect(latInput().value).toBe("");
    expect(lngInput().value).toBe("");
  });

  it("keeps a partial coordinate and only writes geo once complete", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    await user.type(latInput(), "10");
    expect(latInput().value).toBe("10");
    expect(methods.getValues("geo")).toBe("");

    await user.type(lngInput(), "-66");
    expect(methods.getValues("geo")).toBe("10,-66");
  });
});
