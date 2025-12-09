"use client";

import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
} from "react";

import { Button } from "@/components/ui/button";
import { usePwaInstallPrompt } from "@/hooks/use-pwa-install";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { MonitorDown } from "lucide-react";

type InstallPwaChildProps = {
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  [key: string]: unknown;
};

interface InstallPwaHintProps {
  className?: string;
  buttonClassName?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  icon?: LucideIcon;
  label?: string;
  labelClassName?: string;
  ariaLabel?: string;
  hintText?: string;
  installedText?: string;
  children?: ReactElement<InstallPwaChildProps>;
}

export function InstallPwaHint({
  className,
  buttonClassName,
  variant = "secondary",
  size = "sm",
  icon = MonitorDown,
  label = "Install app",
  labelClassName,
  ariaLabel = "Install application",
  hintText = "Ready to install",
  installedText = "App installed",
  children,
}: InstallPwaHintProps) {
  const { isInstallReady, hasInstalled, promptInstall } = usePwaInstallPrompt();

  if (!isInstallReady && !hasInstalled) {
    return null;
  }

  const Icon = icon;

  const handleClick = async (event?: MouseEvent<HTMLElement>) => {
    if (event) {
      children?.props?.onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }
    }

    if (hasInstalled) {
      return;
    }

    await promptInstall();
  };

  const renderButton = () => {
    if (children && isValidElement(children)) {
      return cloneElement(children, {
        onClick: (event?: MouseEvent<HTMLElement>) => {
          void handleClick(event);
        },
        disabled: children.props?.disabled ?? hasInstalled,
        "aria-label": children.props?.["aria-label"] ?? ariaLabel,
        className: cn("gap-1.5", buttonClassName, children.props?.className),
        "data-install-ready": isInstallReady ? "true" : undefined,
      });
    }

    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => {
          void handleClick();
        }}
        disabled={hasInstalled}
        aria-label={ariaLabel}
        className={cn("gap-1.5", buttonClassName)}
        data-install-ready={isInstallReady ? "true" : undefined}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span className={cn(labelClassName)}>{label}</span>
      </Button>
    );
  };

  return (
    <div className={cn("relative flex flex-col items-end", className)}>
      <div className="relative">
        {renderButton()}
        {isInstallReady && !hasInstalled && (
          <span className="pointer-events-none absolute -right-1 -top-1 inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        )}
      </div>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary">
        {hasInstalled ? installedText : hintText}
      </span>
    </div>
  );
}
