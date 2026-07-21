import { describe, expect, it, vi } from "vitest";
import { defaultVCardData } from "@/constants/vcard-constants";
import type { VCardData } from "@/types/vcard-types";
import {
  captureContactImage,
  downloadContactImage,
} from "./contact-image-utils";

const mockCanvas = document.createElement("canvas");

vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue(mockCanvas),
}));

function makeData(overrides: Partial<VCardData> = {}): VCardData {
  return {
    ...JSON.parse(JSON.stringify(defaultVCardData)),
    firstName: "Jane",
    lastName: "Doe",
    phones: [{ type: "cell", value: "555-1234" }],
    ...overrides,
  };
}

describe("captureContactImage", () => {
  it("returns the canvas produced by html2canvas", async () => {
    const data = makeData();
    const canvas = await captureContactImage(data, "3.0", "light");
    expect(canvas).toBe(mockCanvas);
  });

  it("applies the light theme to the wrapper element", async () => {
    const data = makeData();
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    await captureContactImage(data, "3.0", "light");
    const container = appendChildSpy.mock.calls[0][0] as HTMLDivElement;
    const wrapper = container.firstChild as HTMLDivElement;
    expect(wrapper.className).toBe("");
    appendChildSpy.mockRestore();
  });

  it("applies the dark theme to the wrapper element", async () => {
    const data = makeData();
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    await captureContactImage(data, "3.0", "dark");
    const container = appendChildSpy.mock.calls[0][0] as HTMLDivElement;
    const wrapper = container.firstChild as HTMLDivElement;
    expect(wrapper.className).toBe("dark");
    appendChildSpy.mockRestore();
  });

  it("cleans up the temporary DOM after capture", async () => {
    const data = makeData();
    const removeChildSpy = vi.spyOn(document.body, "removeChild");
    await captureContactImage(data, "3.0", "light");
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
    removeChildSpy.mockRestore();
  });
});

describe("downloadContactImage", () => {
  it("triggers a PNG download with the sanitized filename", async () => {
    const canvas = document.createElement("canvas");
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test");
    const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL");

    const mockBlob = new Blob(["png"], { type: "image/png" });
    vi.spyOn(canvas, "toBlob").mockImplementation((callback) => {
      if (callback) callback(mockBlob);
    });

    downloadContactImage(canvas, "Jane Doe");

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test");

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});
