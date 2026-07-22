"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Upload, Download, QrCode, Image, ClipboardPaste, Sun, Moon, X, RotateCcw } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { VCardData, VCardVersion } from "@/types/vcard-types";
import { defaultVCardData } from "@/constants/vcard-constants";
import {
  parseVcf,
  downloadVcf,
  generateVcf,
  isVCardEmpty,
} from "@/lib/vcf-utils";
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
import { PreviewTabs } from "@/components/preview-tabs";
import { ImportVcardDialog } from "@/components/import-vcard-dialog";
import { ExportContactImageDialog } from "@/components/export-contact-image-dialog";
import { SplitButton } from "@/components/shadcn-blocks/split-button";
import { useTheme } from "next-themes";

export function VcfEditor() {
  const [version, setVersion] = useState<VCardVersion>("4.0");
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [exportContactImageOpen, setExportContactImageOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const methods = useForm<VCardData>({
    defaultValues: defaultVCardData,
  });

  const watchedData = methods.watch();
  const [pendingImportText, setPendingImportText] = useState<string | null>(
    null
  );
  const [showImportWarning, setShowImportWarning] = useState(false);
  const versionRef = useRef(version);
  versionRef.current = version;

  const openImport = (tab: "file" | "paste") => {
    setImportTab(tab);
    setImportOpen(true);
  };

  // Shared import path used by the import modal (file + paste) and the
  // whole-window drop. Returns true on success so callers can react.
  const importFromText = (text: string): boolean => {
    // parseVcf never throws on malformed input — it returns a mostly-empty
    // VCardData. Guard explicitly so garbage input gives real feedback.
    const parsedData = parseVcf(text);

    // Not a vCard at all — the user picked the wrong file.
    if (!/BEGIN:VCARD/i.test(text)) {
      toast.error("Import failed", {
        description: "That doesn't look like a valid vCard.",
      });
      return false;
    }

    // A real vCard, just with no contact details in it. Nothing went wrong,
    // so say so plainly instead of reporting a failure.
    if (isVCardEmpty(parsedData)) {
      toast.info("This vCard is empty", {
        description: "It's a valid vCard, but it has no contact details to import.",
      });
      return false;
    }

    methods.reset(parsedData);
    toast.success("Contact imported", {
      description:
        `Successfully imported ${parsedData.firstName} ${parsedData.lastName}`.trim() ||
        "Contact data loaded",
    });
    return true;
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const text = await file.text();
    if (isVCardEmpty(methods.getValues())) {
      importFromText(text);
    } else {
      setPendingImportText(text);
      setShowImportWarning(true);
    }
  };

  const handleImportText = (text: string): boolean => {
    if (isVCardEmpty(methods.getValues())) {
      return importFromText(text);
    }
    setPendingImportText(text);
    setShowImportWarning(true);
    return false;
  };

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: false,
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

  const handleNew = () => {
    methods.reset(defaultVCardData);
    toast("Form cleared", {
      description: "All fields have been reset",
    });
  };

  const togglePreview = () => {
    setShowPreview((prev) => !prev);
  };

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
          onNew={handleNew}
          onOpenImport={openImport}
          onExportVcf={handleExportVcf}
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
          {/* Drag-and-drop overlay */}
          {isDragActive && (
            <div className="pointer-events-none absolute inset-2 z-40 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm transition-colors">
              <Upload className="h-10 w-10 text-primary" />
              <p className="text-lg font-medium text-primary">
                Drop your .vcf file here
              </p>
              <p className="text-sm text-muted-foreground">
                Release to import the contact
              </p>
            </div>
          )}

          {/* Form Panel */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-auto px-4 py-2">
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
                <PreviewTabs data={watchedData} version={version} />
              </div>
            </div>
          </div>
        </div>


        <Footer />
      </div>
      <ImportVcardDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        tab={importTab}
        onTabChange={setImportTab}
        onImportText={handleImportText}
      />
      <ExportContactImageDialog
        data={watchedData}
        version={version}
        open={exportContactImageOpen}
        onOpenChange={setExportContactImageOpen}
      />
      <AlertDialog
        open={showImportWarning}
        onOpenChange={setShowImportWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite all current values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingImportText(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingImportText) {
                  importFromText(pendingImportText);
                  setImportOpen(false);
                }
              }}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Bottom Action Bar for Mobile/Tablet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 flex gap-3 items-center justify-center lg:hidden">
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
              label: "Contact Image",
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
                      handleNew();
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
