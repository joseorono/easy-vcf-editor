"use client";

import {
  Upload,
  Download,
  RotateCcw,
  ChevronRight,
  QrCode,
  Image,
  ClipboardPaste,
  Menu,
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
import { SplitButton } from "@/components/shadcn-blocks/split-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { QrDownloadFormat } from "@/lib/qr-utils";
import type { VCardVersion } from "@/types/vcard-types";

interface EditorNavbarProps {
  version: VCardVersion;
  onVersionChange: (version: VCardVersion) => void;
  onNew: () => void;
  onOpenImport: (tab: "file" | "paste") => void;
  onExportVcf: () => void;
  onExportQr: (format: QrDownloadFormat) => void;
  onExportContactImage: () => void;
  showPreview: boolean;
  onShowPreview: () => void;
  onOpenMenu: () => void;
}

export function EditorNavbar({
  version,
  onVersionChange,
  onNew,
  onOpenImport,
  onExportVcf,
  onExportQr,
  onExportContactImage,
  showPreview,
  onShowPreview,
  onOpenMenu,
}: EditorNavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-14 sm:w-14">
            <img
              src="vcf.svg"
              alt="Easy VCF Editor Logo"
              className="h-6 w-6 sm:h-10 sm:w-10"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold sm:text-base md:text-lg">
              <span className="inline sm:hidden">Easy VCF</span>
              <span className="hidden sm:inline">Easy vCard Editor</span>
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Create and edit VCF contacts
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-3">
          {/* Desktop Layout Buttons */}
          <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent h-8 sm:h-9"
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

            <SplitButton
              variant="outline"
              size="sm"
              mainButtonClassName="h-8 sm:h-9"
              dropdownButtonClassName="h-8 sm:h-9"
              className="hidden lg:inline-flex"
              mainButtonText={<span className="hidden sm:inline">Import</span>}
              mainButtonIcon={Upload}
              mainButtonAriaLabel="Import contact from VCF file"
              onMainButtonClick={() => onOpenImport("file")}
              menuLabel="Import contact from"
              dropdownAriaLabel="Choose contact import option"
              menuItems={[
                {
                  id: "file",
                  label: "From file…",
                  icon: Upload,
                  onClick: () => onOpenImport("file"),
                },
                {
                  id: "paste",
                  label: "Paste vCard…",
                  icon: ClipboardPaste,
                  onClick: () => onOpenImport("paste"),
                },
              ]}
            />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Select
                name="vcf-version"
                value={version}
                onValueChange={(v) => onVersionChange(v as VCardVersion)}
              >
                <SelectTrigger
                  aria-label="vCard version"
                  className="h-8 w-20 text-xs sm:h-9 sm:w-24 sm:text-sm"
                >
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
                mainButtonClassName="h-8 sm:h-9"
                dropdownButtonClassName="h-8 sm:h-9"
                className="hidden lg:inline-flex"
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
                    id: "qr-png",
                    label: "QR Code (PNG)",
                    icon: QrCode,
                    onClick: () => onExportQr("png"),
                  },
                  {
                    id: "qr-svg",
                    label: "QR Code (SVG)",
                    icon: QrCode,
                    onClick: () => onExportQr("svg"),
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

          {/* Desktop ThemeToggle */}
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          {/* Mobile/Tablet Settings Menu Button */}
          <div className="lg:hidden flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={onOpenMenu}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onShowPreview}
            className="gap-1 px-2 lg:hidden h-8 sm:h-9"
            aria-label={showPreview ? "Hide preview" : "Show preview"}
          >
            <span>{showPreview ? "Hide" : "Preview"}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
