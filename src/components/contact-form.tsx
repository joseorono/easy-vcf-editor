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
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
}

function FormSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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

function PhonesField() {
  const { control, register } = useFormContext<VCardData>();
  const { fields, append, remove } = useFieldArray({ control, name: "phones" });

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-end gap-2">
          <div className="w-32">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              defaultValue={field.type || "cell"} // Updated default value to be a non-empty string
              onValueChange={(value) => {
                const input = document.querySelector(
                  `input[name="phones.${index}.type"]`
                ) as HTMLInputElement;
                if (input) {
                  input.value = value;
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
            >
              <SelectTrigger className="bg-background">
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
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Number</Label>
            <Input
              {...register(`phones.${index}.value` as const)}
              placeholder="+1 555 123 4567"
              className="bg-background"
            />
          </div>
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
  const { control, register } = useFormContext<VCardData>();
  const { fields, append, remove } = useFieldArray({ control, name: "emails" });

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-end gap-2">
          <div className="w-32">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              defaultValue={field.type || "home"} // Updated default value to be a non-empty string
              onValueChange={(value) => {
                const input = document.querySelector(
                  `input[name="emails.${index}.type"]`
                ) as HTMLInputElement;
                if (input) {
                  input.value = value;
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
            >
              <SelectTrigger className="bg-background">
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
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              {...register(`emails.${index}.value` as const)}
              type="email"
              placeholder="john@example.com"
              className="bg-background"
            />
          </div>
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
  const { control, register } = useFormContext<VCardData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses",
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-32">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                defaultValue={field.type || "home"} // Updated default value to be a non-empty string
                onValueChange={(value) => {
                  const input = document.querySelector(
                    `input[name="addresses.${index}.type"]`
                  ) as HTMLInputElement;
                  if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                  }
                }}
              >
                <SelectTrigger className="bg-background">
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
        <div key={field.id} className="flex items-end gap-2">
          <div className="w-32">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              defaultValue={field.type || "homepage"} // Updated default value to be a non-empty string
              onValueChange={(value) => {
                const input = document.querySelector(
                  `input[name="urls.${index}.type"]`
                ) as HTMLInputElement;
                if (input) {
                  input.value = value;
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
            >
              <SelectTrigger className="bg-background">
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
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">URL</Label>
            <Input
              {...register(`urls.${index}.value` as const)}
              type="url"
              placeholder="https://example.com"
              className="bg-background"
            />
          </div>
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
        <div key={field.id} className="flex items-end gap-2">
          <div className="w-32">
            <Label className="text-xs text-muted-foreground">Service</Label>
            <Select
              defaultValue={field.type || "other"} // Updated default value to be a non-empty string
              onValueChange={(value) => {
                const input = document.querySelector(
                  `input[name="impps.${index}.type"]`
                ) as HTMLInputElement;
                if (input) {
                  input.value = value;
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
            >
              <SelectTrigger className="bg-background">
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
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Handle</Label>
            <Input
              {...register(`impps.${index}.value` as const)}
              placeholder="username"
              className="bg-background"
            />
          </div>
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
        <div key={field.id} className="flex items-end gap-2">
          <div className="w-36">
            <Label className="text-xs text-muted-foreground">
              Relationship
            </Label>
            <Select
              defaultValue={field.type || "friend"} // Updated default value to be a non-empty string
              onValueChange={(value) => {
                const input = document.querySelector(
                  `input[name="related.${index}.type"]`
                ) as HTMLInputElement;
                if (input) {
                  input.value = value;
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
            >
              <SelectTrigger className="bg-background">
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
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">
              Name or Email
            </Label>
            <Input
              {...register(`related.${index}.value` as const)}
              placeholder="Jane Doe"
              className="bg-background"
            />
          </div>
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

  return (
    <div className="space-y-3">
      <FormSection
        title="Basic Information"
        icon={<User className="h-4 w-4" />}
        defaultOpen
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="firstName" label="First Name" placeholder="John" />
          <FormField name="lastName" label="Last Name" placeholder="Doe" />
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
        <FormField name="nickname" label="Nickname" placeholder="Johnny" />
        <div className="space-y-2">
          <Label
            htmlFor="gender"
            className="text-sm font-medium text-foreground/80"
          >
            Gender
          </Label>
          <Select
            onValueChange={(value) => {
              const input = document.querySelector(
                'input[name="gender"]'
              ) as HTMLInputElement;
              if (input) {
                input.value = value;
                input.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }}
          >
            <SelectTrigger className="bg-background">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="photo"
            label="Photo URL"
            placeholder="https://example.com/photo.jpg"
          />
          <FormField
            name="logo"
            label="Logo URL"
            placeholder="https://example.com/logo.png"
          />
        </div>
      </FormSection>

      <FormSection
        title="Phone"
        icon={<Phone className="h-4 w-4" />}
        badge={filledPhones}
      >
        <PhonesField />
      </FormSection>

      <FormSection
        title="Email"
        icon={<Mail className="h-4 w-4" />}
        badge={filledEmails}
      >
        <EmailsField />
      </FormSection>

      <FormSection
        title="Work & Organization"
        icon={<Briefcase className="h-4 w-4" />}
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
      >
        <AddressesField />
      </FormSection>

      <FormSection
        title="Websites & URLs"
        icon={<Globe className="h-4 w-4" />}
        badge={filledUrls}
      >
        <UrlsField />
      </FormSection>

      <FormSection
        title="Geographic & Time"
        icon={<MapPin className="h-4 w-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="geo"
            label="Coordinates (lat,lng)"
            placeholder="37.7749,-122.4194"
          />
          <FormField
            name="timezone"
            label="Timezone"
            placeholder="America/New_York"
          />
        </div>
      </FormSection>

      <FormSection
        title="Instant Messaging"
        icon={<MessageSquare className="h-4 w-4" />}
        badge={impps.filter((i) => i.value).length}
      >
        <ImppField />
      </FormSection>

      <FormSection
        title="Related People"
        icon={<Users className="h-4 w-4" />}
        badge={related.filter((r) => r.value).length}
      >
        <RelatedField />
      </FormSection>

      <FormSection title="Additional Info" icon={<Info className="h-4 w-4" />}>
        <FormField
          name="categories"
          label="Categories / Tags"
          placeholder="friend, work, vip"
        />
        <FormField
          name="languages"
          label="Languages"
          placeholder="en, fr, de"
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

      <FormSection title="Advanced" icon={<Settings className="h-4 w-4" />}>
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
