"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  captureContactImage,
  downloadContactImage,
  type ContactImageTheme,
} from "@/lib/contact-image-utils";
import { ContactBusinessCard } from "@/components/contact-business-card";
import { buildFullName } from "@/lib/vcf-utils";
import type { VCardData, VCardVersion } from "@/types/vcard-types";

interface ExportContactImageDialogProps {
  data: VCardData;
  version: VCardVersion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getContactImageFilename(data: VCardData): string {
  const fullName = buildFullName(data);
  const sanitized = fullName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return sanitized || "contact";
}

export function ExportContactImageDialog({
  data,
  version,
  open,
  onOpenChange,
}: ExportContactImageDialogProps) {
  const [theme, setTheme] = useState<ContactImageTheme>("light");
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const canvas = await captureContactImage(data, version, theme);
      downloadContactImage(canvas, getContactImageFilename(data));
      toast.success("Contact image exported", {
        description: "PNG downloaded successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Export failed", {
        description:
          error instanceof Error
            ? error.message
            : "Could not generate contact image",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export Contact Image</DialogTitle>
          <DialogDescription>
            Choose a theme for the contact image.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as ContactImageTheme)}
          className="grid-cols-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="theme-light" />
            <Label htmlFor="theme-light">Light</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="theme-dark" />
            <Label htmlFor="theme-dark">Dark</Label>
          </div>
        </RadioGroup>
        {/* Preview */}
        <div className="overflow-hidden rounded-lg border max-h-[520px] overflow-y-auto">
          <div className={`min-h-0 ${theme === "dark" ? "dark bg-background" : "bg-white"}`}>
            <ContactBusinessCard data={data} version={version} />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isLoading}
          >
            {isLoading ? "Exporting..." : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
