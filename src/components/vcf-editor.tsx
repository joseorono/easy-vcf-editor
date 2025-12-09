"use client";

import type React from "react";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VCardData, VCardVersion } from "@/types/vcard-types";
import { defaultVCardData } from "@/constants/vcard-constants";
import {
  parseVcf,
  downloadVcf,
  generateVcf,
  isVCardEmpty,
} from "@/lib/vcf-utils";
import { checkQrDataSize, downloadQrCode, getQrFilename } from "@/lib/qr-utils";
import { ContactForm } from "@/components/contact-form";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { EditorNavbar } from "@/components/editor-navbar";
import { Footer } from "@/components/footer";
import { PreviewTabs } from "@/components/preview-tabs";

export function VcfEditor() {
  const [version, setVersion] = useState<VCardVersion>("4.0");
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const methods = useForm<VCardData>({
    defaultValues: defaultVCardData,
  });

  const watchedData = methods.watch();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedData = parseVcf(text);
      methods.reset(parsedData);
      toast.success("Contact imported", {
        description:
          `Successfully imported ${parsedData.firstName} ${parsedData.lastName}`.trim() ||
          "Contact data loaded",
      });
    } catch {
      toast.error("Import failed", {
        description: "Could not parse the VCF file",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportVcf = () => {
    const data = methods.getValues();
    downloadVcf(data, version);
    toast.success("Contact exported", {
      description: `VCF ${version} file downloaded successfully`,
    });
  };

  const handleExportQr = () => {
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
              downloadQrCode(svg, { filename, format: "png" });
              toast.success("QR code exported", {
                description: "QR code PNG downloaded successfully",
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
    toast.info("Coming soon", {
      description: "Contact image export will be available in a future update",
    });
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

  return (
    <FormProvider {...methods}>
      <div className="flex h-screen flex-col bg-background">
        <EditorNavbar
          version={version}
          onVersionChange={(v) => setVersion(v)}
          onNew={handleNew}
          onImportChange={handleImport}
          onExportVcf={handleExportVcf}
          onExportQr={handleExportQr}
          onExportContactImage={handleExportContactImage}
          showPreview={showPreview}
          onShowPreview={togglePreview}
          fileInputRef={fileInputRef}
        />

        <div className="flex flex-1 overflow-hidden">
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
      <Toaster />
    </FormProvider>
  );
}
