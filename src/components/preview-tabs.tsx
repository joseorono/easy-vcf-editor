"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactPreview } from "@/components/contact-preview";
import { generateVcf } from "@/lib/vcf-utils";
import type { VCardData } from "@/lib/vcf-utils";
import { Eye, Code } from "lucide-react";

interface PreviewTabsProps {
  data: VCardData;
  version: "3.0" | "4.0";
}

export function PreviewTabs({ data, version }: PreviewTabsProps) {
  const [activeTab, setActiveTab] = useState("visual");

  const vcfContent = activeTab === "code" ? generateVcf(data, version) : "";

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
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
        <ContactPreview data={data} />
      </TabsContent>

      <TabsContent value="code" className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs text-foreground">
            {vcfContent}
          </pre>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
