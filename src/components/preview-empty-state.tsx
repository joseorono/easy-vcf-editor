import type { LucideIcon } from "lucide-react";

interface PreviewEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
}

export function PreviewEmptyState({
  icon: Icon,
  title = "No data to display",
  description = "Start filling out the form to see a preview",
}: PreviewEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground/50" />}
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
