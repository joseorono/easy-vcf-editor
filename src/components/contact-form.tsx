"use client";

import type React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronsUpDown,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Globe,
  Info,
  MessageSquare,
  Calendar,
  Users,
  Plus,
  Trash2,
  Settings,
  Star,
} from "lucide-react";
import type {
  VCardData,
  VCardPhone,
  VCardEmail,
  VCardAddress,
  VCardUrl,
  VCardImpp,
  VCardRelated,
} from "@/types/vcard-types";
import {
  phoneTypeLabels,
  emailTypeLabels,
  addressTypeLabels,
  urlTypeLabels,
  imppTypeLabels,
  relatedTypeLabels,
} from "@/constants/vcard-constants";
import { useState, useRef } from "react";
import { cn, updateHiddenInputValue } from "@/lib/utils";
import { LanguageSelector } from "@/components/language-selector";
import { GeoInput } from "@/components/geo-input";
import { TimezoneSelector } from "@/components/timezone-selector";
import { CountryCodeSelector } from "@/components/country-code-selector";

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
  sectionId: string;
  openSettersRef: React.MutableRefObject<
    Map<string, (open: boolean) => void>
  >;
}

function FormSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
  sectionId,
  openSettersRef,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  openSettersRef.current.set(sectionId, setIsOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-4 py-3 text-left transition-colors hover:bg-secondary/50">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
          <span className="font-medium">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="grid gap-4 px-4 pb-2 pt-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FormField({
  name,
  label,
  placeholder,
  type = "text",
}: {
  name: keyof VCardData | string;
  label: string;
  placeholder?: string;
  type?: string;
}) {
  const { register } = useFormContext<VCardData>();

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-foreground/80">
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name as keyof VCardData)}
        className="bg-background"
      />
    </div>
  );
}

export function PhonesField() {
  const { control, register, watch, getValues, setValue } =
    useFormContext<VCardData>();
  const { fields, append, remove } = useFieldArray({ control, name: "phones" });
  const phones = watch("phones") || [];

  // Store country codes separately (not in the phone value)
  const [countryCodes, setCountryCodes] = useState<Record<number, string>>({});

  const handleStarClick = (index: number) => {
    const current = getValues("phones");
    const wasActive = !!current[index]?.pref;
    current.forEach((_, i) => setValue(`phones.${i}.pref`, false));
    if (!wasActive) {
      setValue(`phones.${index}.pref`, true);
    }
  };

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 border-b border-border/20 pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
          <div className="grid grid-cols-12 gap-2 items-end sm:flex sm:gap-2">
            <div className="col-span-6 sm:w-28 sm:shrink-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                defaultValue={field.type || "cell"}
                onValueChange={(value) => {
                  updateHiddenInputValue(
                    `input[name="phones.${index}.type"]`,
                    value
                  );
                }}
              >
                <SelectTrigger className="bg-background" aria-label="Phone type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(phoneTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register(`phones.${index}.type` as const)}
              />
            </div>
            <div className="col-span-6 sm:w-24 sm:shrink-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Code</Label>
              <CountryCodeSelector
                inline
                value={countryCodes[index]}
                onSelect={(code) => {
                  setCountryCodes((prev) => ({
                    ...prev,
                    [index]: code,
                  }));
                }}
              />
            </div>
            <div className="col-span-12 sm:flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Number</Label>
              <Input
                {...register(`phones.${index}.value` as const)}
                placeholder="555 123 4567"
                className="bg-background"
              />
            </div>
            <div className="col-span-12 sm:w-auto flex justify-end gap-1 sm:mb-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <input
                type="hidden"
                {...register(`phones.${index}.pref` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleStarClick(index)}
                className={cn(
                  "shrink-0",
                  phones[index]?.pref
                    ? "text-yellow-500"
                    : "text-muted-foreground hover:text-yellow-500"
                )}
                aria-label={
                  phones[index]?.pref ? "Remove preferred" : "Set as preferred"
                }
                aria-pressed={!!phones[index]?.pref}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    phones[index]?.pref && "fill-current"
                  )}
                />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ type: "cell", value: "" } as VCardPhone)}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Phone
      </Button>
    </div>
  );
}

function EmailsField() {
  const { control, register, watch, getValues, setValue } =
    useFormContext<VCardData>();
  const { fields, append, remove } = useFieldArray({ control, name: "emails" });
  const emails = watch("emails") || [];

  const handleStarClick = (index: number) => {
    const current = getValues("emails");
    const wasActive = !!current[index]?.pref;
    current.forEach((_, i) => setValue(`emails.${i}.pref`, false));
    if (!wasActive) {
      setValue(`emails.${index}.pref`, true);
    }
  };

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 border-b border-border/20 pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
          <div className="grid grid-cols-12 gap-2 items-end sm:flex sm:gap-2">
            <div className="col-span-6 sm:w-32 sm:shrink-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                defaultValue={field.type || "home"} // Updated default value to be a non-empty string
                onValueChange={(value) => {
                  updateHiddenInputValue(
                    `input[name="emails.${index}.type"]`,
                    value
                  );
                }}
              >
                <SelectTrigger className="bg-background" aria-label="Email type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(emailTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register(`emails.${index}.type` as const)}
              />
            </div>
            <div className="col-span-12 sm:flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                {...register(`emails.${index}.value` as const)}
                type="email"
                placeholder="john@example.com"
                className="bg-background"
              />
            </div>
            <div className="col-span-6 sm:w-auto flex justify-end gap-1 sm:mb-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <input
                type="hidden"
                {...register(`emails.${index}.pref` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleStarClick(index)}
                className={cn(
                  "shrink-0",
                  emails[index]?.pref
                    ? "text-yellow-500"
                    : "text-muted-foreground hover:text-yellow-500"
                )}
                aria-label={
                  emails[index]?.pref ? "Remove preferred" : "Set as preferred"
                }
                aria-pressed={!!emails[index]?.pref}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    emails[index]?.pref && "fill-current"
                  )}
                />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ type: "home", value: "" } as VCardEmail)}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Email
      </Button>
    </div>
  );
}

function AddressesField() {
  const { control, register, watch, getValues, setValue } =
    useFormContext<VCardData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses",
  });
  const addresses = watch("addresses") || [];

  const handleStarClick = (index: number) => {
    const current = getValues("addresses");
    const wasActive = !!current[index]?.pref;
    current.forEach((_, i) => setValue(`addresses.${i}.pref`, false));
    if (!wasActive) {
      setValue(`addresses.${index}.pref`, true);
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-32 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                defaultValue={field.type || "home"} // Updated default value to be a non-empty string
                onValueChange={(value) => {
                  updateHiddenInputValue(
                    `input[name="addresses.${index}.type"]`,
                    value
                  );
                }}
              >
                <SelectTrigger className="bg-background" aria-label="Address type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(addressTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register(`addresses.${index}.type` as const)}
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <input
                type="hidden"
                {...register(`addresses.${index}.pref` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleStarClick(index)}
                className={cn(
                  "shrink-0",
                  addresses[index]?.pref
                    ? "text-yellow-500"
                    : "text-muted-foreground hover:text-yellow-500"
                )}
                aria-label={
                  addresses[index]?.pref
                    ? "Remove preferred"
                    : "Set as preferred"
                }
                aria-pressed={!!addresses[index]?.pref}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    addresses[index]?.pref && "fill-current"
                  )}
                />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Input
              {...register(`addresses.${index}.street` as const)}
              placeholder="Street Address"
              className="bg-background"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              {...register(`addresses.${index}.city` as const)}
              placeholder="City"
              className="bg-background"
            />
            <Input
              {...register(`addresses.${index}.state` as const)}
              placeholder="State/Province"
              className="bg-background"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              {...register(`addresses.${index}.postalCode` as const)}
              placeholder="Postal Code"
              className="bg-background"
            />
            <Input
              {...register(`addresses.${index}.country` as const)}
              placeholder="Country"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Input
              {...register(`addresses.${index}.poBox` as const)}
              placeholder="P.O. Box (optional)"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Input
              {...register(`addresses.${index}.extendedAddress` as const)}
              placeholder="Extended Address (optional)"
              className="bg-background"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            type: "home",
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
            poBox: "",
            extendedAddress: "",
          } as VCardAddress)
        }
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Address
      </Button>
    </div>
  );
}

function UrlsField() {
  const { control, register } = useFormContext<VCardData>();
  const { fields, append, remove } = useFieldArray({ control, name: "urls" });

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 border-b border-border/20 pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
          <div className="grid grid-cols-12 gap-2 items-end sm:flex sm:gap-2">
            <div className="col-span-6 sm:w-32 sm:shrink-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                defaultValue={field.type || "homepage"} // Updated default value to be a non-empty string
                onValueChange={(value) => {
                  updateHiddenInputValue(
                    `input[name="urls.${index}.type"]`,
                    value
                  );
                }}
              >
                <SelectTrigger className="bg-background" aria-label="URL type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(urlTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register(`urls.${index}.type` as const)} />
            </div>
            <div className="col-span-12 sm:flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input
                {...register(`urls.${index}.value` as const)}
                type="url"
                placeholder="https://example.com"
                className="bg-background"
              />
            </div>
            <div className="col-span-6 sm:w-auto flex justify-end sm:mb-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ type: "homepage", value: "" } as VCardUrl)}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add URL
      </Button>
    </div>
  );
}

function ImppField() {
  const { control, register } = useFormContext<VCardData>();
  const { fields, append, remove } = useFieldArray({ control, name: "impps" });

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No instant messaging accounts added.
        </p>
      )}
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 border-b border-border/20 pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
          <div className="grid grid-cols-12 gap-2 items-end sm:flex sm:gap-2">
            <div className="col-span-6 sm:w-32 sm:shrink-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Service</Label>
              <Select
                defaultValue={field.type || "other"} // Updated default value to be a non-empty string
                onValueChange={(value) => {
                  updateHiddenInputValue(
                    `input[name="impps.${index}.type"]`,
                    value
                  );
                }}
              >
                <SelectTrigger className="bg-background" aria-label="Instant messaging service">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(imppTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register(`impps.${index}.type` as const)}
              />
            </div>
            <div className="col-span-12 sm:flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Handle</Label>
              <Input
                {...register(`impps.${index}.value` as const)}
                placeholder="username"
                className="bg-background"
              />
            </div>
            <div className="col-span-6 sm:w-auto flex justify-end sm:mb-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ type: "other", value: "" } as VCardImpp)}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Instant Messaging
      </Button>
    </div>
  );
}

function RelatedField() {
  const { control, register } = useFormContext<VCardData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "related",
  });

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No related contacts added.
        </p>
      )}
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 border-b border-border/20 pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
          <div className="grid grid-cols-12 gap-2 items-end sm:flex sm:gap-2">
            <div className="col-span-6 sm:w-36 sm:shrink-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Relationship
              </Label>
              <Select
                defaultValue={field.type || "friend"} // Updated default value to be a non-empty string
                onValueChange={(value) => {
                  updateHiddenInputValue(
                    `input[name="related.${index}.type"]`,
                    value
                  );
                }}
              >
                <SelectTrigger className="bg-background" aria-label="Relationship type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(relatedTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register(`related.${index}.type` as const)}
              />
            </div>
            <div className="col-span-12 sm:flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Name or Email
              </Label>
              <Input
                {...register(`related.${index}.value` as const)}
                placeholder="Jane Doe"
                className="bg-background"
              />
            </div>
            <div className="col-span-6 sm:w-auto flex justify-end sm:mb-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ type: "friend", value: "" } as VCardRelated)}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Related Person
      </Button>
    </div>
  );
}

export function ContactForm() {
  const { register, watch } = useFormContext<VCardData>();
  const phones = watch("phones") || [];
  const emails = watch("emails") || [];
  const addresses = watch("addresses") || [];
  const urls = watch("urls") || [];
  const impps = watch("impps") || [];
  const related = watch("related") || [];

  const filledPhones = phones.filter((p) => p.value).length;
  const filledEmails = emails.filter((e) => e.value).length;
  const filledAddresses = addresses.filter((a) => a.street || a.city).length;
  const filledUrls = urls.filter((u) => u.value).length;
  const openSetters = useRef<Map<string, (open: boolean) => void>>(
    new Map()
  );
  const [lastToggleAction, setLastToggleAction] = useState<
    "expand" | "collapse"
  >("collapse");

  const handleToggleAll = () => {
    if (lastToggleAction === "expand") {
      openSetters.current.forEach((setOpen) =>
        setOpen(false)
      );
      setLastToggleAction("collapse");
    } else {
      openSetters.current.forEach((setOpen) => setOpen(true));
      setLastToggleAction("expand");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end px-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggleAll}
          className="gap-1.5 text-muted-foreground"
          aria-label={
            lastToggleAction === "expand"
              ? "Collapse all sections"
              : "Expand all sections"
          }
        >
          <ChevronsUpDown className="h-4 w-4" />
          {lastToggleAction === "expand" ? "Collapse all" : "Expand all"}
        </Button>
      </div>
      <FormSection
        title="Basic Information"
        icon={<User className="h-4 w-4" />}
        defaultOpen
        sectionId="basic"
        openSettersRef={openSetters}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-foreground/80"
              >
                First Name
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="ml-0.5 cursor-help underline underline-offset-2 decoration-wavy decoration-destructive/60 hover:decoration-destructive"
                      aria-label="Mandatory field"
                    >
                      *
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p className="max-w-xs text-xs">Mandatory field</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              {...register("firstName")}
              className="bg-background"
            />
          </div>
          <FormField name="lastName" label="Last Name" placeholder="Doe" />
          <div className="space-y-2">
            <Label
              htmlFor="gender"
              className="text-sm font-medium text-foreground/80"
            >
              Gender
            </Label>
            <Select
              onValueChange={(value) => {
                updateHiddenInputValue('input[name="gender"]', value);
              }}
            >
              <SelectTrigger className="bg-background" aria-label="Gender">
                <SelectValue placeholder="Not specified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="O">Other</SelectItem>
                <SelectItem value="N">None/Not applicable</SelectItem>
                <SelectItem value="U">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" {...register("gender")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField name="prefix" label="Prefix" placeholder="Dr." />
          <FormField
            name="middleName"
            label="Middle Name"
            placeholder="William"
          />
          <FormField name="suffix" label="Suffix" placeholder="Jr." />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <FormField name="nickname" label="Nickname" placeholder="Johnny" />
          <LanguageSelector />
          <TimezoneSelector />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="photo"
                className="text-sm font-medium text-foreground/80"
              >
                Photo URL
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Photo URL format help"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <p className="max-w-xs text-xs">
                    Use an image URL (https://example.com/photo.jpg) or a
                    base64-encoded data URI (data:image/jpeg;base64,...) as per
                    RFC 6350.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="photo"
              type="text"
              placeholder="https://example.com/photo.jpg"
              {...register("photo")}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="logo"
                className="text-sm font-medium text-foreground/80"
              >
                Logo URL
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Logo URL format help"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <p className="max-w-xs text-xs">
                    Use an image URL (https://example.com/logo.png) or a
                    base64-encoded data URI (data:image/png;base64,...) as per
                    RFC 6350.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="logo"
              type="text"
              placeholder="https://example.com/logo.png"
              {...register("logo")}
              className="bg-background"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Phone"
        icon={<Phone className="h-4 w-4" />}
        badge={filledPhones}
        sectionId="phone"
        openSettersRef={openSetters}
      >
        <PhonesField />
      </FormSection>

      <FormSection
        title="Email"
        icon={<Mail className="h-4 w-4" />}
        badge={filledEmails}
        sectionId="email"
        openSettersRef={openSetters}
      >
        <EmailsField />
      </FormSection>

      <FormSection
        title="Work & Organization"
        icon={<Briefcase className="h-4 w-4" />}
        sectionId="work"
        openSettersRef={openSetters}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="organization"
            label="Organization"
            placeholder="Acme Inc."
          />
          <FormField
            name="department"
            label="Department"
            placeholder="Engineering"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="title"
            label="Job Title"
            placeholder="Software Engineer"
          />
          <FormField name="role" label="Role" placeholder="Developer" />
        </div>
      </FormSection>

      <FormSection
        title="Dates & Calendar"
        icon={<Calendar className="h-4 w-4" />}
        sectionId="dates"
        openSettersRef={openSetters}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="birthday" label="Birthday" type="date" />
          <FormField name="anniversary" label="Anniversary" type="date" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium text-foreground/80">
              Calendar URL
            </Label>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="What is a calendar URL?"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <p className="max-w-xs text-xs">
                    Link to your public calendar or booking page so others can
                    schedule time with you.
                    <a
                      href="https://calendly.com"
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 underline underline-offset-2"
                    >
                      Calendly
                    </a>{" "}
                    is a popular option.
                  </p>
                </TooltipContent>
              </Tooltip>
              <a
                href="https://calendly.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-primary"
              >
                Get one on Calendly
              </a>
            </div>
          </div>
          <Input
            id="calendarUri"
            type="url"
            placeholder="https://cal.example.com/jdoe"
            className="bg-background"
            {...register("calendarUri")}
          />
        </div>
      </FormSection>

      <FormSection
        title="Addresses"
        icon={<MapPin className="h-4 w-4" />}
        badge={filledAddresses}
        sectionId="addresses"
        openSettersRef={openSetters}
      >
        <AddressesField />
      </FormSection>

      <FormSection
        title="Websites & URLs"
        icon={<Globe className="h-4 w-4" />}
        badge={filledUrls}
        sectionId="websites"
        openSettersRef={openSetters}
      >
        <UrlsField />
      </FormSection>

      <FormSection
        title="Geographic"
        icon={<MapPin className="h-4 w-4" />}
        sectionId="geographic"
        openSettersRef={openSetters}
      >
        <GeoInput />
      </FormSection>

      <FormSection
        title="Instant Messaging"
        icon={<MessageSquare className="h-4 w-4" />}
        badge={impps.filter((i) => i.value).length}
        sectionId="messaging"
        openSettersRef={openSetters}
      >
        <ImppField />
      </FormSection>

      <FormSection
        title="Related People"
        icon={<Users className="h-4 w-4" />}
        badge={related.filter((r) => r.value).length}
        sectionId="related"
        openSettersRef={openSetters}
      >
        <RelatedField />
      </FormSection>

      <FormSection
        title="Additional Info"
        icon={<Info className="h-4 w-4" />}
        sectionId="additional"
        openSettersRef={openSetters}
      >
        <FormField
          name="categories"
          label="Categories / Tags"
          placeholder="friend, work, vip"
        />
        <div className="space-y-2">
          <Label
            htmlFor="note"
            className="text-sm font-medium text-foreground/80"
          >
            Notes
          </Label>
          <Textarea
            id="note"
            placeholder="Additional notes about this contact..."
            {...register("note")}
            className="min-h-[100px] bg-background"
          />
        </div>
      </FormSection>

      <FormSection
        title="Advanced"
        icon={<Settings className="h-4 w-4" />}
        sectionId="advanced"
        openSettersRef={openSetters}
      >
        <FormField
          name="publicKey"
          label="Public Key URL"
          placeholder="https://example.com/key.asc"
        />
        <FormField
          name="uid"
          label="UID"
          placeholder="Leave empty to auto-generate"
        />
      </FormSection>
    </div>
  );
}
