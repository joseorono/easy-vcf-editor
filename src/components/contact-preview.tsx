"use client";

import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PreviewEmptyState } from "@/components/preview-empty-state";
import { VcfFormatFooter } from "@/components/vcf-format-footer";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Calendar,
  Smartphone,
  MessageSquare,
  Users,
  Tag,
  Clock,
  FileText,
} from "lucide-react";
import type { VCardData } from "@/types/vcard-types";
import { buildFullName, buildInitials, isVCardEmpty } from "@/lib/vcf-utils";
import {
  phoneTypeLabels,
  emailTypeLabels,
  addressTypeLabels,
  urlTypeLabels,
  imppTypeLabels,
  relatedTypeLabels,
  genderLabels,
} from "@/constants/vcard-constants";

interface ContactPreviewProps {
  data: VCardData;
  compact?: boolean;
}

type PreviewFieldType =
  | "phone"
  | "email"
  | "address"
  | "url"
  | "impp"
  | "related"
  | "date"
  | "organization"
  | "role"
  | "categories"
  | "languages"
  | "note"
  | "geo"
  | "timezone";

function PreviewItem({
  icon,
  label,
  value,
  href,
  fieldType,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  fieldType?: PreviewFieldType;
}) {
  if (!value) return null;

  const modifier = fieldType ? `contact-preview__field--${fieldType}` : "";

  const content = (
    <div className={`contact-preview__field ${modifier} flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50`}>
      <div className="contact-preview__field-icon mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="contact-preview__field-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="contact-preview__field-value mt-0.5 break-words text-sm text-foreground">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block"
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return content;
}

export function ContactPreview({ data, compact }: ContactPreviewProps) {
  const fullName = buildFullName(data);
  const initials = buildInitials(data);

  const hasContactInfo = data.emails?.some((e) => e.value);
  const hasAddresses = data.addresses?.some((a) => a.street || a.city);
  const hasWorkInfo =
    data.organization || data.title || data.role || data.department;
  const hasUrls = data.urls?.some((u) => u.value);
  const hasImpp = data.impps?.some((i) => i.value);
  const hasRelated = data.related?.some((r) => r.value);
  const hasDates = data.birthday || data.anniversary;
  const hasAdditional = data.note || data.categories || data.languages;
  const hasGeo = data.geo || data.timezone;

  const isEmpty = isVCardEmpty(data);

  if (isEmpty) {
    if (compact) {
      return (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          Fill in contact details to see the card
        </div>
      );
    }
    return (
      <PreviewEmptyState
        icon={FileText}
        title="No preview yet"
        description="Start filling out the form to see a preview"
      />
    );
  }

  if (compact) {
    const titleOrg = [data.title, data.organization].filter(Boolean).join(" at ");
    const phones = data.phones?.filter((p) => p.value) ?? [];
    const emails = data.emails?.filter((e) => e.value) ?? [];
    const addresses = data.addresses?.filter((a) => a.street || a.city) ?? [];

    return (
      <div className="contact-preview contact-preview--compact mx-auto w-full max-w-[600px] overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="space-y-2 p-4">
          {/* Header — grid: avatar | name + fields */}
          <div className="contact-preview__header grid grid-cols-[auto_1fr] items-start gap-x-3 pb-2">
            <Avatar className="contact-preview__avatar h-14 w-14 text-lg">
              {data.photo && (
                <AvatarImage
                  className="contact-preview__avatar-image"
                  src={data.photo || "/placeholder.svg"}
                  alt={fullName}
                />
              )}
              <AvatarFallback className="contact-preview__avatar-fallback bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="contact-preview__name truncate text-lg font-semibold">
                {fullName || "Unnamed Contact"}
              </h3>
              {titleOrg && (
                <p className="contact-preview__title truncate text-sm text-muted-foreground">
                  {titleOrg}
                </p>
              )}
              {data.nickname && (
                <p className="contact-preview__nickname text-xs text-muted-foreground">
                  &ldquo;{data.nickname}&rdquo;
                </p>
              )}
              {/* Phones — same column, below nickname */}
              {phones.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {phones.map((phone, i) => (
                    <PreviewItem
                      key={i}
                      icon={
                        phone.type === "cell" ? (
                          <Smartphone className="h-3.5 w-3.5" />
                        ) : (
                          <Phone className="h-3.5 w-3.5" />
                        )
                      }
                      label={phoneTypeLabels[phone.type]}
                      value={phone.value}
                      fieldType="phone"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Emails */}
          {emails.length > 0 && (
            <div className="space-y-0.5">
              {emails.map((email, i) => (
                <PreviewItem
                  key={i}
                  icon={<Mail className="h-3.5 w-3.5" />}
                  label={emailTypeLabels[email.type]}
                  value={email.value}
                  fieldType="email"
                />
              ))}
            </div>
          )}

          {/* Addresses */}
          {addresses.length > 0 && (
            <div className="space-y-0.5">
              {addresses.map((addr, i) => {
                const formatted = [
                  addr.street,
                  addr.city,
                  addr.state,
                  addr.postalCode,
                  addr.country,
                ]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <PreviewItem
                    key={i}
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label={addressTypeLabels[addr.type]}
                    value={formatted}
                    fieldType="address"
                  />
                );
              })}
            </div>
          )}

          {/* Note */}
          {data.note && (
            <div className="contact-preview__field contact-preview__field--note flex items-start gap-3 rounded-lg p-2">
              <div className="contact-preview__field-icon mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="contact-preview__field-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="contact-preview__field-value mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                  {data.note}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="contact-preview__footer border-t px-4 py-2">
          <VcfFormatFooter />
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full [will-change:scroll-position] [contain:layout_style_paint]">
      <div className="contact-preview space-y-5 p-4">
        {/* Header Card */}
        <div className="contact-preview__header grid grid-cols-[auto_1fr] items-start gap-x-4 rounded-xl border border-border/50 bg-secondary/30 p-4">
          <Avatar className="contact-preview__avatar h-16 w-16 text-lg">
            {data.photo && (
              <AvatarImage
                className="contact-preview__avatar-image"
                src={data.photo || "/placeholder.svg"}
                alt={fullName}
              />
            )}
            <AvatarFallback className="contact-preview__avatar-fallback bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="contact-preview__name truncate text-lg font-semibold">
              {fullName || "Unnamed Contact"}
            </h3>
            {data.nickname && (
              <p className="contact-preview__nickname text-sm text-muted-foreground">"{data.nickname}"</p>
            )}
            {(data.title || data.organization) && (
              <p className="contact-preview__title mt-1 text-sm text-muted-foreground">
                {[data.title, data.organization].filter(Boolean).join(" at ")}
              </p>
            )}
            {data.gender && (
              <Badge variant="outline" className="contact-preview__gender mt-1.5 text-xs">
                {genderLabels[data.gender]}
              </Badge>
            )}
            {/* Phones — same column, below identity */}
            {data.phones?.filter((p) => p.value).map((phone, i) => (
              <PreviewItem
                key={i}
                icon={
                  phone.type === "cell" ? (
                    <Smartphone className="h-3.5 w-3.5" />
                  ) : (
                    <Phone className="h-3.5 w-3.5" />
                  )
                }
                label={phoneTypeLabels[phone.type]}
                value={phone.value}
                href={`tel:${phone.value}`}
                fieldType="phone"
              />
            ))}
          </div>
        </div>

        {/* Contact Info */}
        {hasContactInfo && (
          <div className="contact-preview__section contact-preview__section--contact">
            <h4 className="contact-preview__section-title mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contact
            </h4>
            <div className="space-y-1">
              {data.emails
                ?.filter((e) => e.value)
                .map((email, i) => (
                  <PreviewItem
                    key={i}
                    icon={<Mail className="h-3.5 w-3.5" />}
                    label={emailTypeLabels[email.type]}
                    value={email.value}
                    href={`mailto:${email.value}`}
                    fieldType="email"
                  />
                ))}
            </div>
          </div>
        )}

        {/* Work */}
        {hasWorkInfo && (
          <div className="contact-preview__section contact-preview__section--work">
            <h4 className="contact-preview__section-title mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Work
            </h4>
            <div className="space-y-1">
              {data.organization && (
                <PreviewItem
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label="Organization"
                  value={
                    data.department
                      ? `${data.organization} - ${data.department}`
                      : data.organization
                  }
                  fieldType="organization"
                />
              )}
              {data.role && data.role !== data.title && (
                <PreviewItem
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label="Role"
                  value={data.role}
                  fieldType="role"
                />
              )}
            </div>
          </div>
        )}

        {/* Addresses */}
        {hasAddresses && (
          <div className="contact-preview__section contact-preview__section--addresses">
            <h4 className="contact-preview__section-title mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Addresses
            </h4>
            <div className="space-y-1">
              {data.addresses
                ?.filter((a) => a.street || a.city)
                .map((addr, i) => {
                  const formatted = [
                    addr.street,
                    addr.city,
                    addr.state,
                    addr.postalCode,
                    addr.country,
                  ]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <PreviewItem
                      key={i}
                      icon={<MapPin className="h-3.5 w-3.5" />}
                      label={addressTypeLabels[addr.type]}
                      value={formatted}
                      fieldType="address"
                    />
                  );
                })}
            </div>
          </div>
        )}

        {/* URLs */}
        {hasUrls && (
          <div className="contact-preview__section contact-preview__section--web">
            <h4 className="contact-preview__section-title mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Web
            </h4>
            <div className="space-y-1">
              {data.urls
                ?.filter((u) => u.value)
                .map((url, i) => (
                  <PreviewItem
                    key={i}
                    icon={<Globe className="h-3.5 w-3.5" />}
                    label={urlTypeLabels[url.type]}
                    value={url.value}
                    href={url.value}
                    fieldType="url"
                  />
                ))}
            </div>
          </div>
        )}

        {/* Instant Messaging */}
        {hasImpp && (
          <div className="contact-preview__section contact-preview__section--messaging">
            <h4 className="contact-preview__section-title mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Messaging
            </h4>
            <div className="space-y-1">
              {data.impps
                ?.filter((i) => i.value)
                .map((impp, i) => (
                  <PreviewItem
                    key={i}
                    icon={<MessageSquare className="h-3.5 w-3.5" />}
                    label={imppTypeLabels[impp.type]}
                    value={impp.value}
                    fieldType="impp"
                  />
                ))}
            </div>
          </div>
        )}

        {/* Dates */}
        {hasDates && (
          <div className="contact-preview__section contact-preview__section--dates">
            <h4 className="contact-preview__section-title mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dates
            </h4>
            <div className="space-y-1">
              {data.birthday && (
                <PreviewItem
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Birthday"
                  value={data.birthday}
                  fieldType="date"
                />
              )}
              {data.anniversary && (
                <PreviewItem
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Anniversary"
                  value={data.anniversary}
                  fieldType="date"
                />
              )}
            </div>
          </div>
        )}

        {/* Related People */}
        {hasRelated && (
          <div className="contact-preview__section contact-preview__section--related">
            <h4 className="contact-preview__section-title mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Related
            </h4>
            <div className="space-y-1">
              {data.related
                ?.filter((r) => r.value)
                .map((rel, i) => (
                  <PreviewItem
                    key={i}
                    icon={<Users className="h-3.5 w-3.5" />}
                    label={relatedTypeLabels[rel.type]}
                    value={rel.value}
                    fieldType="related"
                  />
                ))}
            </div>
          </div>
        )}

        {/* Geographic */}
        {hasGeo && (
          <div className="contact-preview__section contact-preview__section--location">
            <h4 className="contact-preview__section-title mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </h4>
            <div className="space-y-1">
              {data.geo && (
                <PreviewItem
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Coordinates"
                  value={data.geo}
                  fieldType="geo"
                />
              )}
              {data.timezone && (
                <PreviewItem
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Timezone"
                  value={data.timezone}
                  fieldType="timezone"
                />
              )}
            </div>
          </div>
        )}

        {/* Additional */}
        {hasAdditional && (
          <div className="contact-preview__section contact-preview__section--additional">
            <h4 className="contact-preview__section-title mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Additional
            </h4>
            <div className="space-y-1">
              {data.categories && (
                <PreviewItem
                  icon={<Tag className="h-3.5 w-3.5" />}
                  label="Categories"
                  value={data.categories}
                  fieldType="categories"
                />
              )}
              {data.languages && (
                <PreviewItem
                  icon={<Globe className="h-3.5 w-3.5" />}
                  label="Languages"
                  value={data.languages}
                  fieldType="languages"
                />
              )}
              {data.note && (
                <div className="contact-preview__field contact-preview__field--note rounded-lg p-2">
                  <p className="contact-preview__field-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="contact-preview__field-value mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {data.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="contact-preview__footer">
          <VcfFormatFooter />
        </div>
      </div>
    </ScrollArea>
  );
}
