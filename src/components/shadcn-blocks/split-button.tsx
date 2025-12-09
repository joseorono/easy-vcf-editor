import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import React from "react";

export interface SplitButtonMenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** The text or content to display */
  label: React.ReactNode;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Click handler for the menu item */
  onClick?: () => void;
  /** Whether this item is disabled */
  disabled?: boolean;
  /** Whether this item should be a separator */
  separator?: boolean;
}

export interface SplitButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The main button text */
  mainButtonText: React.ReactNode;
  /** Icon for the main button */
  mainButtonIcon?: LucideIcon;
  /** Classes for the main button icon */
  mainButtonIconClassName?: string;
  /** Click handler for the main button */
  onMainButtonClick?: () => void;
  /** Accessible label for the main button */
  mainButtonAriaLabel?: string;
  /** Array of dropdown menu items */
  menuItems: SplitButtonMenuItem[];
  /** Optional dropdown menu label */
  menuLabel?: React.ReactNode;
  /** Icon for the dropdown trigger */
  dropdownIcon?: LucideIcon;
  /** Accessible label for dropdown trigger */
  dropdownAriaLabel?: string;
  /** Button variant for both buttons */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  /** Button size for both buttons */
  size?: "default" | "sm" | "lg" | "icon";
  /** Whether the main button is disabled */
  mainButtonDisabled?: boolean;
  /** Whether the dropdown is disabled */
  dropdownDisabled?: boolean;
  /** Custom className for the main button */
  mainButtonClassName?: string;
  /** Custom className for the dropdown button */
  dropdownButtonClassName?: string;
  /** Custom className for the dropdown content */
  dropdownContentClassName?: string;
  /** Show close button in dropdown label */
  showCloseButton?: boolean;
  /** Close button click handler */
  onCloseClick?: () => void;
}

const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(
  (
    {
      mainButtonText,
      mainButtonIcon: MainButtonIcon,
      mainButtonIconClassName,
      onMainButtonClick,
      mainButtonAriaLabel,
      menuItems,
      menuLabel,
      dropdownIcon: DropdownIcon = ChevronDown,
      dropdownAriaLabel = "Open menu",
      variant = "default",
      size = "default",
      mainButtonDisabled = false,
      dropdownDisabled = false,
      mainButtonClassName,
      dropdownButtonClassName,
      dropdownContentClassName,
      showCloseButton = false,
      onCloseClick,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex [&>*]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md",
          className
        )}
        {...props}
      >
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={mainButtonDisabled}
          onClick={onMainButtonClick}
          className={mainButtonClassName}
          aria-label={mainButtonAriaLabel}
        >
          {MainButtonIcon && (
            <MainButtonIcon className={mainButtonIconClassName} />
          )}
          <span>{mainButtonText}</span>
        </Button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={variant}
              size={size}
              disabled={dropdownDisabled}
              className={cn("-ml-px px-2", dropdownButtonClassName)}
              aria-label={dropdownAriaLabel}
              aria-haspopup="menu"
            >
              <DropdownIcon />
              <span className="sr-only">{dropdownAriaLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn("min-w-52", dropdownContentClassName)}
          >
            {menuLabel && (
              <>
                <DropdownMenuLabel
                  className={cn(
                    showCloseButton
                      ? "flex items-center justify-between gap-2"
                      : ""
                  )}
                >
                  {menuLabel}
                  {showCloseButton && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={onCloseClick}
                    >
                      <ChevronDown className="rotate-180" />
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            {menuItems.map((item) => {
              if (item.separator) {
                return <DropdownMenuSeparator key={item.id} />;
              }

              const ItemIcon = item.icon;

              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={item.onClick}
                  disabled={item.disabled}
                >
                  {ItemIcon && <ItemIcon />}
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

SplitButton.displayName = "SplitButton";

export { SplitButton };
export default SplitButton;
