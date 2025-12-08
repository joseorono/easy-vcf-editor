"use client";

import * as React from "react";
import { FileText, Upload, Download, Plus, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";

type VcfVersion = "3.0" | "4.0";

interface EditorNavbarProps {
  version: VcfVersion;
  onVersionChange: (version: VcfVersion) => void;
  onNew: () => void;
  onImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  showPreview: boolean;
  onShowPreview: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function EditorNavbar({
  version,
  onVersionChange,
  onNew,
  onImportChange,
  onExport,
  showPreview,
  onShowPreview,
  fileInputRef,
}: EditorNavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold sm:text-lg">
              vCard Editor
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Create and edit VCF contacts
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onNew}
              className="gap-1.5 bg-transparent"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowPreview}
              className="gap-1.5 lg:hidden"
            >
              <span>{showPreview ? "Hide" : "Preview"}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Select
                name="vcf-version"
                value={version}
                onValueChange={(v) => onVersionChange(v as VcfVersion)}
              >
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.0">v4.0</SelectItem>
                  <SelectItem value="3.0">v3.0</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={onExport} className="gap-1.5">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".vcf,.vcard"
        onChange={onImportChange}
        className="hidden"
      />
    </header>
  );
}
