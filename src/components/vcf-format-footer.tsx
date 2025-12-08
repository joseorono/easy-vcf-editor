import type { VCardVersion } from "@/types/vcard-types";

interface VcfFormatFooterProps {
  version: VCardVersion;
}

export function VcfFormatFooter({ version }: VcfFormatFooterProps) {
  return (
    <p className="text-center text-xs text-muted-foreground">
      vCard {version} format
    </p>
  );
}
