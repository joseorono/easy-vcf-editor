"use client";

import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactPreviewEmptyState } from "@/components/contact-preview-empty-state";
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
} from "lucide-react";
import type { VCardData, VCardVersion } from "@/types/vcard-types";
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
  version: VCardVersion;
}

function PreviewItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  if (!value) return null;

  const content = (
    <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm text-foreground">{value}</p>
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

export function ContactPreview({ data, version }: ContactPreviewProps) {
  const fullName = buildFullName(data);
  const initials = buildInitials(data);

  const hasContactInfo =
    data.emails?.some((e) => e.value) || data.phones?.some((p) => p.value);
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
    return <ContactPreviewEmptyState />;
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-4">
        {/* Header Card */}
        <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/30 p-4">
          <Avatar className="h-16 w-16 text-lg">
            {data.photo && (
              <AvatarImage
                src={data.photo || "/placeholder.svg"}
                alt={fullName}
              />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold">
              {fullName || "Unnamed Contact"}
            </h3>
            {data.nickname && (
              <p className="text-sm text-muted-foreground">"{data.nickname}"</p>
            )}
            {(data.title || data.organization) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {[data.title, data.organization].filter(Boolean).join(" at ")}
              </p>
            )}
            {data.gender && (
              <Badge variant="outline" className="mt-1.5 text-xs">
                {genderLabels[data.gender]}
              </Badge>
            )}
          </div>
        </div>

        {/* Contact Info */}
        {hasContactInfo && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                  />
                ))}
              {data.phones
                ?.filter((p) => p.value)
                .map((phone, i) => (
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
                  />
                ))}
            </div>
          </div>
        )}

        {/* Work */}
        {hasWorkInfo && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                />
              )}
              {data.role && data.role !== data.title && (
                <PreviewItem
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label="Role"
                  value={data.role}
                />
              )}
            </div>
          </div>
        )}

        {/* Addresses */}
        {hasAddresses && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                    />
                  );
                })}
            </div>
          </div>
        )}

        {/* URLs */}
        {hasUrls && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                  />
                ))}
            </div>
          </div>
        )}

        {/* Instant Messaging */}
        {hasImpp && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                  />
                ))}
            </div>
          </div>
        )}

        {/* Dates */}
        {hasDates && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dates
            </h4>
            <div className="space-y-1">
              {data.birthday && (
                <PreviewItem
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Birthday"
                  value={data.birthday}
                />
              )}
              {data.anniversary && (
                <PreviewItem
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Anniversary"
                  value={data.anniversary}
                />
              )}
            </div>
          </div>
        )}

        {/* Related People */}
        {hasRelated && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                  />
                ))}
            </div>
          </div>
        )}

        {/* Geographic */}
        {hasGeo && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </h4>
            <div className="space-y-1">
              {data.geo && (
                <PreviewItem
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Coordinates"
                  value={data.geo}
                />
              )}
              {data.timezone && (
                <PreviewItem
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Timezone"
                  value={data.timezone}
                />
              )}
            </div>
          </div>
        )}

        {/* Additional */}
        {hasAdditional && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Additional
            </h4>
            <div className="space-y-1">
              {data.categories && (
                <PreviewItem
                  icon={<Tag className="h-3.5 w-3.5" />}
                  label="Categories"
                  value={data.categories}
                />
              )}
              {data.languages && (
                <PreviewItem
                  icon={<Globe className="h-3.5 w-3.5" />}
                  label="Languages"
                  value={data.languages}
                />
              )}
              {data.note && (
                <div className="rounded-lg p-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {data.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        <VcfFormatFooter version={version} />
      </div>
    </ScrollArea>
  );
}
