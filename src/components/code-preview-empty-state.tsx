import { FileCode2 } from "lucide-react";

export function CodePreviewEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <FileCode2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Start filling out the form to generate VCF code
      </p>
    </div>
  );
}
