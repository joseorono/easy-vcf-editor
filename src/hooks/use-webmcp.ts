import { useEffect, useRef } from "react";
import type { VCardData } from "@/types/vcard-types";

// Fields an agent may set in one `fill_contact` call. Scalars overwrite;
// `phone`/`email` are appended to the existing arrays as a new entry.
export interface WebMcpFillFields {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nickname?: string;
  organization?: string;
  department?: string;
  title?: string;
  role?: string;
  birthday?: string;
  note?: string;
  phone?: string;
  email?: string;
}

export interface UseWebMcpOptions {
  /** Current contact as structured data. */
  getContact: () => VCardData;
  /** Replace the whole contact (used to apply partial fills). */
  setContact: (data: VCardData) => void;
  /** Current contact serialized as vCard text. */
  getVCardText: () => string;
  /** Import a full vCard string; returns true on success. */
  importVCardText: (text: string) => boolean;
  /** Download the current contact as a .vcf file. */
  exportVCard: () => void;
  /** Reset the form to a blank contact. */
  clearContact: () => void;
}

const SCALAR_FILL_KEYS = [
  "firstName",
  "lastName",
  "middleName",
  "nickname",
  "organization",
  "department",
  "title",
  "role",
  "birthday",
  "note",
] as const;

function textResult(text: string): WebMcpToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Registers WebMCP tools so agentic browsers can drive the editor. This is a
 * progressive enhancement: it does nothing unless the browser exposes
 * `navigator.modelContext`, so it is inert in every current browser and can
 * never affect normal users.
 *
 * Options are read through a ref so the registered tools always act on the
 * latest state without re-registering on every render.
 */
export function useWebMcp(options: UseWebMcpOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const modelContext = navigator.modelContext;
    if (!modelContext || typeof modelContext.registerTool !== "function") {
      return;
    }

    const applyFill = (fields: WebMcpFillFields) => {
      const current = optionsRef.current.getContact();
      const next: VCardData = { ...current };
      for (const key of SCALAR_FILL_KEYS) {
        const value = fields[key];
        if (typeof value === "string") {
          next[key] = value;
        }
      }
      if (fields.phone) {
        next.phones = [...current.phones, { type: "cell", value: fields.phone }];
      }
      if (fields.email) {
        next.emails = [...current.emails, { type: "home", value: fields.email }];
      }
      optionsRef.current.setContact(next);
    };

    const tools: WebMcpTool[] = [
      {
        name: "read_contact",
        description:
          "Read the contact currently loaded in the editor, as both vCard text and structured JSON.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => {
          const vcard = optionsRef.current.getVCardText();
          const data = optionsRef.current.getContact();
          return textResult(
            `Current contact (vCard):\n${vcard}\n\nStructured data:\n${JSON.stringify(data, null, 2)}`
          );
        },
      },
      {
        name: "fill_contact",
        description:
          "Set common fields on the current contact. Scalar fields overwrite; phone and email are added as new entries. Only provided fields are changed.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            middleName: { type: "string" },
            nickname: { type: "string" },
            organization: { type: "string" },
            department: { type: "string" },
            title: { type: "string", description: "Job title." },
            role: { type: "string" },
            birthday: { type: "string", description: "ISO date, e.g. 1990-05-21." },
            note: { type: "string" },
            phone: { type: "string", description: "A phone number to add (typed as cell)." },
            email: { type: "string", description: "An email address to add (typed as home)." },
          },
        },
        execute: async (args) => {
          applyFill(args as WebMcpFillFields);
          return textResult("Contact fields updated.");
        },
      },
      {
        name: "import_vcard",
        description:
          "Replace the current contact by importing a full vCard string (must begin with BEGIN:VCARD).",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["vcard"],
          properties: {
            vcard: { type: "string", description: "Full vCard text beginning with BEGIN:VCARD." },
          },
        },
        execute: async (args) => {
          const vcard = typeof args.vcard === "string" ? args.vcard : "";
          const ok = optionsRef.current.importVCardText(vcard);
          return textResult(
            ok ? "vCard imported into the editor." : "Import failed: the text is not a valid, non-empty vCard."
          );
        },
      },
      {
        name: "export_vcard",
        description: "Download the current contact as a .vcf file.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => {
          optionsRef.current.exportVCard();
          return textResult("Started downloading the contact as a .vcf file.");
        },
      },
      {
        name: "clear_contact",
        description: "Reset the editor to a blank contact.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => {
          optionsRef.current.clearContact();
          return textResult("The contact form has been cleared.");
        },
      },
    ];

    const registrations = tools.map((tool) => ({
      tool,
      handle: modelContext.registerTool?.(tool),
    }));

    return () => {
      for (const { tool, handle } of registrations) {
        try {
          if (handle && typeof handle.unregister === "function") {
            handle.unregister();
          } else if (typeof modelContext.unregisterTool === "function") {
            modelContext.unregisterTool(tool.name);
          }
        } catch {
          // Best-effort cleanup; ignore browsers that lack an unregister path.
        }
      }
    };
  }, []);
}
