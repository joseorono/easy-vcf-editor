import type { VCardVersion } from "@/types/vcard-types";

interface VcfFormatFooterProps {
  version: VCardVersion;
}

export function VcfFormatFooter({ version }: VcfFormatFooterProps) {
  return (
    <div className="mt-4 border-t border-border/50 pt-2">
      <p className="text-center text-xs text-muted-foreground">
        vCard {version} format
      </p>
    </div>
  );
}
