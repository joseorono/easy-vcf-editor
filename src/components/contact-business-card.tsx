"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VcfFormatFooter } from "@/components/vcf-format-footer";
import { Mail, Phone, MapPin, Smartphone } from "lucide-react";
import QRCode from "react-qr-code";
import type { VCardData, VCardVersion } from "@/types/vcard-types";
import {
  buildFullName,
  buildInitials,
  generateVcf,
  isVCardEmpty,
} from "@/lib/vcf-utils";
import { checkQrDataSize } from "@/lib/qr-utils";
import {
  phoneTypeLabels,
  emailTypeLabels,
  addressTypeLabels,
} from "@/constants/vcard-constants";

interface ContactBusinessCardProps {
  data: VCardData;
  version: VCardVersion;
}

type InfoItemField = "phone" | "email" | "address";

function InfoItem({
  icon,
  label,
  value,
  fieldType,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  fieldType: InfoItemField;
}) {
  if (!value) return null;

  const modifier = `contact-card__field--${fieldType}`;

  return (
    <div className={`contact-card__field ${modifier} flex items-center gap-2 rounded-md`}>
      <div className="contact-card__field-icon flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="contact-card__field-label shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="contact-card__field-value min-w-0 flex-1 truncate text-sm text-foreground">
        {value}
      </span>
    </div>
  );
}

export function ContactBusinessCard({ data, version }: ContactBusinessCardProps) {
  const fullName = buildFullName(data);
  const initials = buildInitials(data);
  const titleOrg = [data.title, data.organization].filter(Boolean).join(" at ");

  const vcfContent = generateVcf(data, version);
  const qrStatus = checkQrDataSize(vcfContent);

  const phones = data.phones?.filter((p) => p.value) ?? [];
  const emails = data.emails?.filter((e) => e.value) ?? [];
  const addresses = data.addresses?.filter((a) => a.street || a.city) ?? [];

  const isEmpty = isVCardEmpty(data);

  if (isEmpty) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Fill in contact details to see the business card
      </div>
    );
  }

  return (
    <div className="contact-card w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="p-5">
        {/* Top row: identity + QR */}
        <div className="contact-card__header flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="contact-card__avatar h-16 w-16 text-lg">
              {data.photo && (
                <AvatarImage
                  className="contact-card__avatar-image"
                  src={data.photo || "/placeholder.svg"}
                  alt={fullName}
                />
              )}
              <AvatarFallback className="contact-card__avatar-fallback bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="contact-card__name truncate text-xl font-semibold">
                {fullName || "Unnamed Contact"}
              </h3>
              {titleOrg && (
                <p className="contact-card__title truncate text-sm text-muted-foreground">
                  {titleOrg}
                </p>
              )}
              {data.nickname && (
                <p className="contact-card__nickname text-xs text-muted-foreground">
                  &ldquo;{data.nickname}&rdquo;
                </p>
              )}
              {/* Phones — inside identity block, below nickname */}
              {phones.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {phones.map((phone, i) => (
                    <InfoItem
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

          {/* QR code with white background for scanability */}
          <div className="contact-card__qr shrink-0 rounded bg-white p-1.5 shadow-sm">
            {qrStatus.isValid ? (
              <QRCode
                value={vcfContent}
                size={112}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            ) : (
              <div className="flex h-[112px] w-[112px] items-center justify-center text-center text-[10px] text-muted-foreground">
                QR too large
              </div>
            )}
          </div>
        </div>

        {/* Emails and addresses in two columns */}
        {(emails.length > 0 || addresses.length > 0) && (
          <div className="contact-card__details mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="contact-card__emails space-y-0.5">
              {emails.map((email, i) => (
                <InfoItem
                  key={i}
                  icon={<Mail className="h-3.5 w-3.5" />}
                  label={emailTypeLabels[email.type]}
                  value={email.value}
                  fieldType="email"
                />
              ))}
            </div>

            <div className="contact-card__addresses space-y-0.5">
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
                  <InfoItem
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
      </div>

      {/* Footer */}
      <div className="contact-card__footer border-t px-5 py-2">
        <VcfFormatFooter />
      </div>
    </div>
  );
}
