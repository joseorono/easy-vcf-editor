import type { VCardData, VCardVersion } from "@/types/vcard-types";
import { ContactBusinessCard } from "@/components/contact-business-card";

export type ContactImageTheme = "light" | "dark";

/** Creates a temporary off-screen DOM element, renders the ContactBusinessCard with
 *  the selected theme, and captures it via html2canvas at 2x scale.
 *  Returns the canvas element. */
export async function captureContactImage(
  data: VCardData,
  version: VCardVersion,
  theme: ContactImageTheme
): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "600px";
  document.body.appendChild(container);

  const wrapper = document.createElement("div");
  wrapper.className = theme === "dark" ? "dark" : "";
  container.appendChild(wrapper);

  try {
    const [{ createElement }, { createRoot }, { default: html2canvas }] =
      await Promise.all([
        import("react"),
        import("react-dom/client"),
        import("html2canvas"),
      ]);

    const root = createRoot(wrapper);
    root.render(createElement(ContactBusinessCard, { data, version }));

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const canvas = await html2canvas(wrapper.firstChild as HTMLElement, {
      scale: 2,
      backgroundColor: null,
    });

    root.unmount();
    return canvas;
  } finally {
    document.body.removeChild(container);
  }
}

/** Converts a canvas to a PNG blob and triggers a browser download.
 *  The filename is sanitized before use. */
export function downloadContactImage(
  canvas: HTMLCanvasElement,
  filename: string
): void {
  const baseName = filename.replace(/\.png$/i, "");
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  canvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitized || "contact"}_contact.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, "image/png");
}
