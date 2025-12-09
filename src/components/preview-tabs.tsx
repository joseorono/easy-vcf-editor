"use client";

import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ContactPreview } from "@/components/contact-preview";
import { PreviewEmptyState } from "@/components/preview-empty-state";
import { VcfFormatFooter } from "@/components/vcf-format-footer";
import { generateVcf, isVCardEmpty } from "@/lib/vcf-utils";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import type { VCardData, VCardVersion } from "@/types/vcard-types";
import {
  Eye,
  Code,
  Clipboard,
  Check,
  QrCode,
  Download,
  AlertTriangle,
} from "lucide-react";
import QRCode from "react-qr-code";
import { checkQrDataSize, downloadQrCode, getQrFilename } from "@/lib/qr-utils";
import { cn } from "@/lib/utils";

interface PreviewTabsProps {
  data: VCardData;
  version: VCardVersion;
}

export function PreviewTabs({ data, version }: PreviewTabsProps) {
  const [activeTab, setActiveTab] = useState("visual");
  const { copied, copy } = useCopyToClipboard();
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const isEmpty = isVCardEmpty(data);

  // Generate VCF content for code and QR tabs
  const vcfContent =
    (activeTab === "code" || activeTab === "qr") && !isEmpty
      ? generateVcf(data, version)
      : "";

  // Check QR data size
  const qrStatus = vcfContent ? checkQrDataSize(vcfContent) : null;

  const handleDownloadQr = () => {
    const svg = qrContainerRef.current?.querySelector("svg");
    if (svg) {
      const filename = getQrFilename(data.firstName, data.lastName);
      downloadQrCode(svg, filename);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex h-full flex-col"
    >
      <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent p-0">
        <TabsTrigger
          value="visual"
          className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Eye className="mr-2 h-4 w-4" />
          Visual
        </TabsTrigger>
        <TabsTrigger
          value="code"
          className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Code className="mr-2 h-4 w-4" />
          Code
        </TabsTrigger>
        <TabsTrigger
          value="qr"
          className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <QrCode className="mr-2 h-4 w-4" />
          QR Code
        </TabsTrigger>
      </TabsList>

      <TabsContent value="visual" className="flex-1 overflow-hidden">
        <ContactPreview data={data} version={version} />
      </TabsContent>

      <TabsContent
        value="code"
        className="flex-1 overflow-hidden space-y-5 p-4"
      >
        <div className="flex h-full flex-col rounded-md border border-border/60 bg-muted/30">
          <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium">VCF Code</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copy(vcfContent)}
              disabled={!vcfContent}
              className="gap-1 px-2 text-xs"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Clipboard className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {copied ? "Copied" : "Copy"}
              </span>
            </Button>
          </div>
          <ScrollArea className="h-full w-full">
            {isEmpty ? (
              <PreviewEmptyState
                icon={Code}
                title="No VCF code yet"
                description="Fill out the form to generate VCF code"
              />
            ) : (
              <pre className="whitespace-pre-wrap break-words px-3 py-3 font-mono text-xs text-foreground">
                {vcfContent}
              </pre>
            )}
          </ScrollArea>
        </div>

        <VcfFormatFooter version={version} />
      </TabsContent>

      <TabsContent value="qr" className="flex-1 overflow-hidden space-y-4 p-4">
        {isEmpty ? (
          <PreviewEmptyState
            icon={QrCode}
            title="No QR code yet"
            description="Fill out the form to generate a QR code"
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* QR Code Display */}
            <div
              ref={qrContainerRef}
              className="rounded-lg border border-border/60 bg-white p-4"
            >
              {qrStatus?.isValid ? (
                <QRCode value={vcfContent} size={200} level="M" />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center">
                  <div className="text-center text-destructive">
                    <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm font-medium">Data too large</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status indicator */}
            {qrStatus && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-xs",
                  !qrStatus.isValid
                    ? "bg-destructive/10 text-destructive"
                    : qrStatus.isWarning
                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {!qrStatus.isValid && <AlertTriangle className="h-3.5 w-3.5" />}
                <span>{qrStatus.message}</span>
              </div>
            )}

            {/* Download button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadQr}
              disabled={!qrStatus?.isValid}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download QR Code
            </Button>

            {/* Info text */}
            <p className="text-center text-xs text-muted-foreground max-w-[250px]">
              Scan this QR code to import the contact directly into your phone
              or contacts app.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
