"use client";

import type React from "react";

import { useState, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type VCardData,
  defaultVCardData,
  parseVcf,
  downloadVcf,
} from "@/lib/vcf-utils";
import { ContactForm } from "@/components/contact-form";
import { ContactPreview } from "@/components/contact-preview";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { EditorNavbar } from "@/components/editor-navbar";

export function VcfEditor() {
  const [version, setVersion] = useState<"3.0" | "4.0">("4.0");
  const [showPreview, setShowPreview] = useState(false);
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

  const handleExport = () => {
    const data = methods.getValues();
    downloadVcf(data, version);
    toast.success("Contact exported", {
      description: `VCF ${version} file downloaded successfully`,
    });
  };

  const handleNew = () => {
    methods.reset(defaultVCardData);
    toast("Form cleared", {
      description: "Ready to create a new contact",
    });
  };

  const togglePreview = () => {
    setShowPreview((prev) => !prev);
  };

  return (
    <FormProvider {...methods}>
      <div className="flex min-h-screen flex-col bg-background">
        <EditorNavbar
          version={version}
          onVersionChange={(v) => setVersion(v)}
          onNew={handleNew}
          onImportChange={handleImport}
          onExport={handleExport}
          showPreview={showPreview}
          onShowPreview={togglePreview}
          fileInputRef={fileInputRef}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Form Panel */}
          <div
            className={cn(
              "flex flex-col flex-1 overflow-hidden transition-all duration-300",
              showPreview ? "hidden lg:flex lg:flex-1" : "w-full"
            )}
          >
            <div className="flex-1 overflow-auto px-4 py-6">
              <div className="mx-auto max-w-3xl">
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="p-6">
                    <ContactForm />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Preview Panel - sticky on desktop, full-screen on mobile when active */}
          <div
            className={cn(
              "border-l border-border/50 bg-card/50 transition-all duration-300",
              showPreview
                ? "fixed inset-0 z-50 bg-background lg:static lg:z-auto lg:w-[400px] lg:bg-transparent"
                : "hidden lg:block lg:w-[400px]"
            )}
          >
            <div className="sticky top-0 flex h-screen flex-col">
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
                <ContactPreview data={watchedData} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </FormProvider>
  );
}
