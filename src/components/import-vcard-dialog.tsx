"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { ClipboardPaste, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ImportTab = "file" | "paste";

interface ImportVcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: ImportTab;
  onTabChange: (tab: ImportTab) => void;
  /**
   * Parses and applies vCard text. Returns `true` when the import succeeded
   * (the dialog can close) and `false` when it failed (keep it open so the
   * user can retry).
   */
  onImportText: (text: string) => boolean;
}

const PASTE_PLACEHOLDER = `BEGIN:VCARD
VERSION:4.0
FN:Jane Doe
EMAIL:jane@example.com
END:VCARD`;

export function ImportVcardDialog({
  open,
  onOpenChange,
  tab,
  onTabChange,
  onImportText,
}: ImportVcardDialogProps) {
  const [pastedText, setPastedText] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPastedText("");
    }
    onOpenChange(nextOpen);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    // Concatenating is enough — the parser re-splits on BEGIN:VCARD, so several
    // files behave exactly like one multi-contact file.
    const texts = await Promise.all(acceptedFiles.map((file) => file.text()));
    const succeeded = onImportText(texts.join("\r\n"));
    if (succeeded) {
      handleOpenChange(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "text/vcard": [".vcf", ".vcard"],
      "text/directory": [".vcf"],
    },
  });

  const handlePasteImport = () => {
    const succeeded = onImportText(pastedText);
    if (succeeded) {
      setPastedText("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
          <DialogDescription>
            Add contacts from .vcf files or pasted vCard text.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => onTabChange(value as ImportTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="gap-1.5">
              <Upload className="h-4 w-4" />
              Upload file
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-1.5">
              <ClipboardPaste className="h-4 w-4" />
              Paste text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <div
              {...getRootProps()}
              className={cn(
                "flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              )}
            >
              <input {...getInputProps()} />
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">
                  {isDragActive
                    ? "Drop your vCards here"
                    : "Drag & drop your vCards here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse • .vcf, .vcard • multiple files welcome
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="paste">
            <Textarea
              value={pastedText}
              onChange={(event) => setPastedText(event.target.value)}
              placeholder={PASTE_PLACEHOLDER}
              className="min-h-[200px] bg-background font-mono text-sm"
              aria-label="vCard text"
            />
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handlePasteImport}
                disabled={!pastedText.trim()}
                className="gap-1.5"
              >
                <ClipboardPaste className="h-4 w-4" />
                Import
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
