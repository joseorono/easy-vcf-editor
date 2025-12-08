"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ContactPreview } from "@/components/contact-preview";
import { CodePreviewEmptyState } from "@/components/code-preview-empty-state";
import { generateVcf, isVCardEmpty } from "@/lib/vcf-utils";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import type { VCardData } from "@/types/vcard-types";
import { Eye, Code, Clipboard, Check } from "lucide-react";

interface PreviewTabsProps {
  data: VCardData;
  version: "2.1" | "3.0" | "4.0";
}

export function PreviewTabs({ data, version }: PreviewTabsProps) {
  const [activeTab, setActiveTab] = useState("visual");
  const { copied, copy } = useCopyToClipboard();

  const isEmpty = isVCardEmpty(data);

  const vcfContent =
    activeTab === "code" && !isEmpty ? generateVcf(data, version) : "";

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
              <CodePreviewEmptyState />
            ) : (
              <pre className="whitespace-pre-wrap break-words px-3 py-3 font-mono text-xs text-foreground">
                {vcfContent}
              </pre>
            )}
          </ScrollArea>
        </div>
      </TabsContent>
    </Tabs>
  );
}
