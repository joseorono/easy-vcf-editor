"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
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

export function VcfEditor() {
  const [version, setVersion] = useState<VCardVersion>("4.0");
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [exportContactImageOpen, setExportContactImageOpen] = useState(false);

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
      <div className="flex h-screen flex-col bg-background">
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
        />

        <div
          {...getRootProps()}
          className="relative flex flex-1 overflow-hidden"
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
          <div
            className={cn(
              "flex flex-col flex-1 overflow-hidden transition-all duration-300",
              showPreview && "hidden lg:flex lg:flex-1"
            )}
          >
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
              "border-l border-border/50 bg-card/50 pl-1 transition-all duration-300",
              showPreview
                ? "fixed inset-0 z-50 bg-background lg:static lg:z-auto lg:w-[400px] lg:bg-transparent"
                : "hidden lg:block lg:w-[400px]",
              isPreviewCollapsed &&
                "lg:w-0 lg:opacity-0 lg:pointer-events-none lg:border-l-0"
            )}
          >
            <div className="flex flex-col overflow-hidden">
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
      <Toaster />
    </FormProvider>
  );
}
