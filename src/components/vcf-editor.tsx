"use client";

import { useState, useRef, useEffect, lazy, Suspense, useDeferredValue } from "react";
import { ChevronLeft, ChevronRight, Upload, Download, QrCode, Image, ClipboardPaste, Sun, Moon, X, RotateCcw, Users } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { VCardData, VCardVersion } from "@/types/vcard-types";
import {
  parseVcf,
  parseVcfCollection,
  downloadVcf,
  downloadVcfCollection,
  generateVcf,
  isVCardEmpty,
  createBlankVCardData,
} from "@/lib/vcf-utils";
import { ContactDBQueries } from "@/db/queries";
import { useContactAutosave } from "@/hooks/use-contact-autosave";
import { ContactList } from "@/components/contact-list/contact-list";
import { ImportModeDialog } from "@/components/import-mode-dialog";
import {
  checkQrDataSize,
  downloadQrCode,
  getQrFilename,
  type QrDownloadFormat,
} from "@/lib/qr-utils";
import { ContactForm } from "@/components/contact-form";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { EditorNavbar } from "@/components/editor-navbar";
import { Footer } from "@/components/footer";
import { SplitButton } from "@/components/shadcn-blocks/split-button";
import { useTheme } from "next-themes";
import { Loader } from "@/components/loader";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useWebMcp } from "@/hooks/use-webmcp";

// Lazy so react-qr-code and the rest of the preview code leave the initial
// entry bundle — the panel is off-screen on mobile until the user opens it.
const PreviewTabs = lazy(() =>
  import("@/components/preview-tabs").then((m) => ({
    default: m.PreviewTabs,
  }))
);

const ImportVcardDialog = lazy(() =>
  import("@/components/import-vcard-dialog").then((m) => ({
    default: m.ImportVcardDialog,
  }))
);

const ExportContactImageDialog = lazy(() =>
  import("@/components/export-contact-image-dialog").then((m) => ({
    default: m.ExportContactImageDialog,
  }))
);

export function VcfEditor() {
  const [version, setVersion] = useState<VCardVersion>("4.0");
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [exportContactImageOpen, setExportContactImageOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDesktop = useIsDesktop();

  const methods = useForm<VCardData>({
    defaultValues: createBlankVCardData(),
  });

  const watchedData = methods.watch();
  const deferredData = useDeferredValue(watchedData);
  const {
    activeContactId,
    selectContact,
    flushPendingSave,
    cancelPendingSave,
    applyToActiveContact,
  } = useContactAutosave(methods);
  const [pendingImport, setPendingImport] = useState<VCardData[] | null>(null);
  const [isContactListOpen, setIsContactListOpen] = useState(false);
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const versionRef = useRef(version);
  versionRef.current = version;

  const openImport = (tab: "file" | "paste") => {
    setImportTab(tab);
    setImportOpen(true);
  };

  const describeContact = (data: VCardData): string =>
    `${data.firstName} ${data.lastName}`.trim();

  /**
   * Shared import path for the modal (file + paste) and the whole-window drop.
   * Returns true when the import is finished, so the modal knows it can close;
   * false either means it failed, or that we've handed off to the chooser
   * dialog and the modal should stay put behind it.
   */
  const handleIncomingVcfText = (text: string): boolean => {
    // Not a vCard at all — the user picked the wrong file.
    if (!/BEGIN:VCARD/i.test(text)) {
      toast.error("Import failed", {
        description: "That doesn't look like a valid vCard.",
      });
      return false;
    }

    const contacts = parseVcfCollection(text).filter(
      (contact) => !isVCardEmpty(contact)
    );

    // Real vCards, just with no contact details in them. Nothing went wrong,
    // so say so plainly instead of reporting a failure.
    if (contacts.length === 0) {
      toast.info("Nothing to import", {
        description: "Those are valid vCards, but they have no contact details.",
      });
      return false;
    }

    // A single card landing on an untouched contact needs no decision — this is
    // the original one-contact behavior, preserved.
    if (contacts.length === 1 && isVCardEmpty(methods.getValues())) {
      void applyToActiveContact(contacts[0]);
      toast.success("Contact imported", {
        description: describeContact(contacts[0])
          ? `Successfully imported ${describeContact(contacts[0])}`
          : "Contact data loaded",
      });
      return true;
    }

    setPendingImport(contacts);
    return false;
  };

  const handleImportAsNew = async () => {
    if (!pendingImport) return;
    const contacts = pendingImport;
    setPendingImport(null);

    // An auto-created blank contact would just sit there as clutter above the
    // contacts we're about to add, so retire it.
    const shouldDropBlankActive =
      contacts.length > 1 && isVCardEmpty(methods.getValues());
    const blankActiveId = activeContactId;

    await flushPendingSave();
    const ids = await ContactDBQueries.bulkInsertContacts(contacts);

    if (shouldDropBlankActive && blankActiveId) {
      cancelPendingSave();
      await ContactDBQueries.deleteContact(blankActiveId);
    }

    await selectContact(ids[0]);
    setImportOpen(false);
    toast.success(
      contacts.length === 1 ? "Contact imported" : "Contacts imported",
      {
        description:
          contacts.length === 1
            ? `${describeContact(contacts[0]) || "Contact"} added to your library`
            : `${contacts.length} contacts added to your library`,
      }
    );
  };

  const handleImportAsReplacement = async () => {
    if (!pendingImport) return;
    const [contact] = pendingImport;
    setPendingImport(null);

    await applyToActiveContact(contact);
    setImportOpen(false);
    toast.success("Contact replaced", {
      description: describeContact(contact)
        ? `Now editing ${describeContact(contact)}`
        : "Contact data loaded",
    });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    // Concatenating is enough — the parser re-splits on BEGIN:VCARD, so several
    // files behave exactly like one multi-contact file.
    const texts = await Promise.all(acceptedFiles.map((file) => file.text()));
    handleIncomingVcfText(texts.join("\r\n"));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
    accept: {
      "text/vcard": [".vcf", ".vcard"],
      "text/directory": [".vcf"],
    },
  });

  const handleExportVcf = () => {
    const data = methods.getValues();
    downloadVcf(data, version);
    toast.success("Contact exported", {
      description: `VCF ${version} file downloaded successfully`,
    });
  };

  const handleExportQr = (format: QrDownloadFormat = "png") => {
    const data = methods.getValues();
    if (isVCardEmpty(data)) {
      toast.error("Cannot export QR", {
        description: "Please fill in at least one field first",
      });
      return;
    }

    const vcfContent = generateVcf(data, version);
    const qrStatus = checkQrDataSize(vcfContent);

    if (!qrStatus.isValid) {
      toast.error("Data too large for QR", {
        description: "Remove some fields to fit within QR code limits",
      });
      return;
    }

    // Create a temporary QR code element to download
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    document.body.appendChild(tempContainer);

    // Dynamically import and render QR code
    import("react-qr-code").then(({ default: QRCode }) => {
      import("react-dom/client").then(({ createRoot }) => {
        import("react").then(({ createElement }) => {
          const root = createRoot(tempContainer);
          root.render(
            createElement(QRCode, {
              value: vcfContent,
              size: 512,
              level: "M",
            })
          );

          // Wait for render, then download
          setTimeout(() => {
            const svg = tempContainer.querySelector("svg");
            if (svg) {
              const filename = getQrFilename(data.firstName, data.lastName);
              downloadQrCode(svg, { filename, format });
              toast.success("QR code exported", {
                description:
                  format === "svg"
                    ? "QR code SVG downloaded successfully"
                    : "QR code PNG downloaded successfully",
              });
            }
            root.unmount();
            document.body.removeChild(tempContainer);
          }, 100);
        });
      });
    });
  };

  const handleExportContactImage = () => {
    const data = methods.getValues();
    if (isVCardEmpty(data)) {
      toast.error("Cannot export contact image", {
        description: "Please fill in at least one field first",
      });
      return;
    }
    setExportContactImageOpen(true);
  };

  const handleExportAllVcf = async () => {
    await flushPendingSave();
    const rows = await ContactDBQueries.getAllContacts();
    const list = rows
      .map((row) => row.data)
      .filter((data) => !isVCardEmpty(data));

    if (list.length === 0) {
      toast.error("Nothing to export", {
        description: "Your library has no filled-in contacts yet.",
      });
      return;
    }

    downloadVcfCollection(list, version);
    toast.success("Contacts exported", {
      description: `${list.length} contacts downloaded as contacts.vcf`,
    });
  };

  /** Blanks the contact being edited, leaving it in the library. */
  const handleClearContact = () => {
    void applyToActiveContact(createBlankVCardData());
    toast("Form cleared", {
      description: "All fields have been reset",
    });
  };

  const handleNewContact = async () => {
    await flushPendingSave();
    const id = await ContactDBQueries.insertContact(createBlankVCardData());
    await selectContact(id);
    toast.success("Contact created", {
      description: "Start filling in the new contact",
    });
  };

  const handleDeleteContact = async (id: string) => {
    const wasActive = id === activeContactId;
    // Don't let a queued edit resurrect the row we're about to delete.
    if (wasActive) cancelPendingSave();

    // Work out the neighbour before deleting, so selection lands next to where
    // the user was rather than jumping to the top of the list.
    const rows = await ContactDBQueries.getAllContacts();
    const index = rows.findIndex((row) => row.id === id);
    const neighbourId = rows[index + 1]?.id ?? rows[index - 1]?.id ?? null;

    await ContactDBQueries.deleteContact(id);
    toast.success("Contact deleted");

    if (wasActive) {
      // Deleting the last contact re-seeds a blank one, so the editor always
      // has something to edit.
      await selectContact(neighbourId ?? (await ContactDBQueries.ensureSeedContact()));
    }
  };

  const togglePreview = () => {
    // Both overlays are full-screen on mobile, so only one can be up at a time.
    setIsContactListOpen(false);
    setShowPreview((prev) => !prev);
  };

  // Expose the editor to agentic browsers via WebMCP. Feature-detected inside
  // the hook, so this is inert in browsers without `navigator.modelContext`.
  useWebMcp({
    getContact: () => methods.getValues(),
    // Goes through the autosave hook so agent edits are persisted, not just
    // shown — a bare `reset` is deliberately invisible to autosave.
    setContact: (data) => void applyToActiveContact(data),
    getVCardText: () => generateVcf(methods.getValues(), versionRef.current),
    importVCardText: (text) => {
      if (!/BEGIN:VCARD/i.test(text)) return false;
      const parsed = parseVcf(text);
      if (isVCardEmpty(parsed)) return false;
      void applyToActiveContact(parsed);
      return true;
    },
    exportVCard: handleExportVcf,
    clearContact: handleClearContact,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && !e.repeat) {
        e.preventDefault();
        downloadVcf(methods.getValues(), versionRef.current);
        toast.success("Contact exported", {
          description: `VCF ${versionRef.current} file downloaded successfully`,
        });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <FormProvider {...methods}>
      <div className="flex h-[100dvh] flex-col bg-background">
        <EditorNavbar
          version={version}
          onVersionChange={(v) => setVersion(v)}
          onClear={handleClearContact}
          onOpenImport={openImport}
          onExportVcf={handleExportVcf}
          onExportAllVcf={() => void handleExportAllVcf()}
          onExportQr={handleExportQr}
          onExportContactImage={handleExportContactImage}
          showPreview={showPreview}
          onShowPreview={togglePreview}
          onOpenMenu={() => setIsMenuOpen(true)}
        />

        <div
          {...getRootProps()}
          className="relative flex flex-1 overflow-hidden pb-16 lg:pb-0"
        >
          <input {...getInputProps()} />
          {/* Drag-and-drop overlay */}
          {isDragActive && (
            <div className="pointer-events-none absolute inset-2 z-40 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm transition-colors">
              <Upload className="h-10 w-10 text-primary" />
              <p className="text-lg font-medium text-primary">
                Drop your .vcf file(s) here
              </p>
              <p className="text-sm text-muted-foreground">
                Release to import the contact(s)
              </p>
            </div>
          )}

          {/* Contact List Rail */}
          <ContactList
            isOpen={isContactListOpen}
            onClose={() => setIsContactListOpen(false)}
            isCollapsed={isRailCollapsed}
            onSelectContact={(id) => void selectContact(id)}
            onNewContact={() => void handleNewContact()}
            onDeleteContact={(id) => void handleDeleteContact(id)}
          />

          {/* Contact list collapse handle - desktop only */}
          <div className="relative hidden h-full items-center justify-center lg:flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsRailCollapsed((prev) => !prev)}
              className="z-20 h-10 w-6 mx-1 flex items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground shadow-sm transition-colors hover:bg-background"
              aria-label={
                isRailCollapsed ? "Show contact list" : "Hide contact list"
              }
            >
              {isRailCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Form Panel */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-auto px-4 py-2 [will-change:scroll-position] [contain:layout_style_paint]">
              <Card className="border-border/50 shadow-lg py-2">
                <CardContent className="p-4 py-2">
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Preview collapse handle - desktop only */}
          <div className="relative hidden h-full items-center justify-center lg:flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsPreviewCollapsed((prev) => !prev)}
              className="z-20 h-10 w-6 mx-1 flex items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground shadow-sm transition-colors hover:bg-background"
              aria-label={
                isPreviewCollapsed ? "Show live preview" : "Hide live preview"
              }
            >
              {isPreviewCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Preview Panel - sticky on desktop, full-screen on mobile when active */}
          <div
            className={cn(
              "border-l border-border/50 bg-card/50 pl-1 flex flex-col h-full",
              // Mobile transition styles (slide in from right)
              "fixed inset-0 z-50 bg-background transform transition-transform duration-300 ease-in-out",
              showPreview ? "translate-x-0" : "translate-x-full pointer-events-none lg:pointer-events-auto",
              // Desktop overrides
              "lg:static lg:translate-x-0 lg:z-auto lg:w-[400px] lg:bg-transparent lg:transform-none lg:transition-none lg:border-l lg:border-border/50",
              isPreviewCollapsed &&
                "lg:w-0 lg:opacity-0 lg:pointer-events-none lg:border-l-0"
            )}
          >
            <div className="flex flex-col flex-1 h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <h2 className="font-semibold">Live Preview</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="lg:hidden"
                >
                  Back to form
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                {/* Desktop shows the preview by default; on mobile it stays
                    unmounted (and its chunk unloaded) until the user opens it. */}
                {(isDesktop || showPreview) && (
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <Loader />
                      </div>
                    }
                  >
                    <PreviewTabs data={deferredData} version={version} />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>


        <Footer />
      </div>
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-xs">
            <Loader />
          </div>
        }
      >
        <ImportVcardDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          tab={importTab}
          onTabChange={setImportTab}
          onImportText={handleIncomingVcfText}
        />
        <ExportContactImageDialog
          data={deferredData}
          version={version}
          open={exportContactImageOpen}
          onOpenChange={setExportContactImageOpen}
        />
      </Suspense>
      <ImportModeDialog
        open={pendingImport !== null}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null);
        }}
        contactCount={pendingImport?.length ?? 0}
        incomingName={pendingImport?.[0] ? describeContact(pendingImport[0]) : ""}
        canReplace={pendingImport?.length === 1}
        onAddNew={() => void handleImportAsNew()}
        onReplace={() => void handleImportAsReplacement()}
      />
      {/* Bottom Action Bar for Mobile/Tablet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 flex gap-3 items-center justify-center lg:hidden">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
          onClick={() => {
            setShowPreview(false);
            setIsContactListOpen(true);
          }}
          aria-label="Show contact list"
        >
          <Users className="h-4 w-4" />
        </Button>
        <SplitButton
          variant="outline"
          size="sm"
          className="flex-1"
          mainButtonClassName="flex-1 h-9 justify-center"
          dropdownButtonClassName="h-9 px-3"
          mainButtonText={<span>Import</span>}
          mainButtonIcon={Upload}
          mainButtonAriaLabel="Import contact from VCF file"
          onMainButtonClick={() => openImport("file")}
          menuLabel="Import contact from"
          dropdownAriaLabel="Choose contact import option"
          menuItems={[
            {
              id: "file",
              label: "From file…",
              icon: Upload,
              onClick: () => openImport("file"),
            },
            {
              id: "paste",
              label: "Paste vCard…",
              icon: ClipboardPaste,
              onClick: () => openImport("paste"),
            },
          ]}
        />
        <SplitButton
          size="sm"
          className="flex-1"
          mainButtonClassName="flex-1 h-9 justify-center"
          dropdownButtonClassName="h-9 px-3"
          mainButtonText={<span>Download</span>}
          mainButtonIcon={Download}
          onMainButtonClick={handleExportVcf}
          menuLabel="Download contact as"
          dropdownAriaLabel="Choose contact download option"
          menuItems={[
            {
              id: "vcf",
              label: "VCF File",
              icon: Download,
              onClick: handleExportVcf,
            },
            {
              id: "vcf-all",
              label: "All contacts (.vcf)",
              icon: Users,
              onClick: () => void handleExportAllVcf(),
            },
            {
              id: "qr-png",
              label: "QR Code (PNG)",
              icon: QrCode,
              onClick: () => handleExportQr("png"),
            },
            {
              id: "qr-svg",
              label: "QR Code (SVG)",
              icon: QrCode,
              onClick: () => handleExportQr("svg"),
            },
            {
              id: "image",
              label: "Contact Card",
              icon: Image,
              onClick: handleExportContactImage,
            },
          ]}
        />
      </div>

      {/* Custom sliding drawer menu for Mobile/Tablet */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200 lg:hidden",
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      <div
        className={cn(
          "fixed top-14 right-4 w-72 z-50 bg-white dark:bg-neutral-950 border border-border shadow-xl rounded-lg flex flex-col p-5 gap-5 transition-all duration-200 ease-out origin-top-right transform lg:hidden",
          isMenuOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Options</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          {/* VCF Version Section */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              VCF Version
            </span>
            <div className="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-md">
              {(["4.0", "3.0", "2.1"] as VCardVersion[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVersion(v)}
                  className={cn(
                    "py-1.5 px-2 text-xs font-medium rounded-sm transition-all",
                    version === v
                      ? "bg-white dark:bg-neutral-800 text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  v{v}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Section */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Theme
            </span>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="w-full justify-between h-9"
            >
              {resolvedTheme === "dark" ? (
                <>
                  <span className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-sky-400" />
                    Dark Theme
                  </span>
                  <span className="text-xs text-muted-foreground">Active</span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    Light Theme
                  </span>
                  <span className="text-xs text-muted-foreground">Active</span>
                </>
              )}
            </Button>
          </div>

          {/* Actions Section */}
          <div className="space-y-2 pt-4 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actions
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2 justify-center h-9"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Contact
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear this contact?</AlertDialogTitle>
                </AlertDialogHeader>
                <p className="text-sm text-muted-foreground">
                  This will remove all values from the form and reset it to a
                  blank contact. This action cannot be undone.
                </p>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      handleClearContact();
                      setIsMenuOpen(false);
                    }}
                  >
                    Clear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      <Toaster />
    </FormProvider>
  );
}
