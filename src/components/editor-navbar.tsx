"use client";

import * as React from "react";
import {
  Upload,
  Download,
  RotateCcw,
  ChevronRight,
  QrCode,
  Image,
  MonitorDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { SplitButton } from "@/components/shadcn-blocks/split-button";
import { InstallPwaHint } from "@/components/install-pwa-hint";
import type { VCardVersion } from "@/types/vcard-types";

interface EditorNavbarProps {
  version: VCardVersion;
  onVersionChange: (version: VCardVersion) => void;
  onNew: () => void;
  onImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportVcf: () => void;
  onExportQr: () => void;
  onExportContactImage: () => void;
  showPreview: boolean;
  onShowPreview: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function EditorNavbar({
  version,
  onVersionChange,
  onNew,
  onImportChange,
  onExportVcf,
  onExportQr,
  onExportContactImage,
  showPreview,
  onShowPreview,
  fileInputRef,
}: EditorNavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <img
              src="/pwa-icon.svg"
              alt="Easy VCF Editor Logo"
              className="h-6 w-6"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold sm:text-lg">
              Easy vCard Editor
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Create and edit VCF contacts
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {/*
            <InstallPwaHint>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                aria-label="Install Easy VCF Editor"
              >
                <MonitorDown className="h-4 w-4" />
                <span className="hidden md:inline">Install app</span>
              </Button>
            </InstallPwaHint>
            */}

          <div className="flex flex-wrap items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent"
                  aria-label="Clear current contact"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
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
                  <AlertDialogAction onClick={onNew}>Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
              aria-label="Import contact from VCF file"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <div className="flex items-center gap-2">
              <Select
                name="vcf-version"
                value={version}
                onValueChange={(v) => onVersionChange(v as VCardVersion)}
              >
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.0">v4.0</SelectItem>
                  <SelectItem value="3.0">v3.0</SelectItem>
                  <SelectItem value="2.1">v2.1</SelectItem>
                </SelectContent>
              </Select>
              <SplitButton
                size="sm"
                mainButtonText={
                  <span className="hidden sm:inline">Download</span>
                }
                mainButtonIcon={Download}
                onMainButtonClick={onExportVcf}
                menuLabel="Download contact as"
                dropdownAriaLabel="Choose contact download option"
                menuItems={[
                  {
                    id: "vcf",
                    label: "VCF File",
                    icon: Download,
                    onClick: onExportVcf,
                  },
                  {
                    id: "qr",
                    label: "QR Code",
                    icon: QrCode,
                    onClick: onExportQr,
                  },
                  {
                    id: "image",
                    label: "Contact Image",
                    icon: Image,
                    onClick: onExportContactImage,
                  },
                ]}
              />
            </div>
          </div>

          <ThemeToggle />

          <Button
            variant="outline"
            size="sm"
            onClick={onShowPreview}
            className="gap-1.5 lg:hidden"
            aria-label={showPreview ? "Hide preview" : "Show preview"}
          >
            <span>{showPreview ? "Hide" : "Preview"}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
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
