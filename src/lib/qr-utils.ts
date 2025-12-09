/**
 * QR Code utilities for vCard data
 *
 * QR Code capacity limits (standard version):
 * - Numeric only: up to 7,089 characters
 * - Alphanumeric: up to 4,296 characters
 * - Binary/byte: up to 2,953 bytes (~3KB)
 *
 * For vCard data (mixed content), we use the binary limit as reference.
 * With error correction level L (7%), max is ~2,953 bytes.
 * With error correction level M (15%), max is ~2,331 bytes.
 * With error correction level Q (25%), max is ~1,663 bytes.
 * With error correction level H (30%), max is ~1,273 bytes.
 *
 * We use level M as a good balance between capacity and error correction.
 */

/** Maximum bytes for QR code with error correction level M */
export const QR_MAX_BYTES_LEVEL_M = 2331;

/** Maximum bytes for QR code with error correction level L */
export const QR_MAX_BYTES_LEVEL_L = 2953;

/** Warning threshold - show warning when approaching limit */
export const QR_WARNING_THRESHOLD = 0.8;

export interface QrDataStatus {
  /** Current byte size of the data */
  byteSize: number;
  /** Maximum allowed bytes */
  maxBytes: number;
  /** Percentage of capacity used (0-1) */
  usagePercent: number;
  /** Whether data fits in QR code */
  isValid: boolean;
  /** Whether we're approaching the limit */
  isWarning: boolean;
  /** Human-readable status message */
  message: string;
}

/**
 * Calculate the byte size of a string (UTF-8 encoded)
 */
export function getByteSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Check if vCard data fits within QR code limits
 */
export function checkQrDataSize(
  vcfContent: string,
  maxBytes: number = QR_MAX_BYTES_LEVEL_M
): QrDataStatus {
  const byteSize = getByteSize(vcfContent);
  const usagePercent = byteSize / maxBytes;
  const isValid = byteSize <= maxBytes;
  const isWarning = usagePercent >= QR_WARNING_THRESHOLD && isValid;

  let message: string;
  if (!isValid) {
    const overBy = byteSize - maxBytes;
    message = `Data exceeds QR capacity by ${overBy.toLocaleString()} bytes. Consider removing some fields.`;
  } else if (isWarning) {
    const remaining = maxBytes - byteSize;
    message = `Approaching QR capacity limit. ${remaining.toLocaleString()} bytes remaining.`;
  } else {
    message = `${byteSize.toLocaleString()} / ${maxBytes.toLocaleString()} bytes used`;
  }

  return {
    byteSize,
    maxBytes,
    usagePercent,
    isValid,
    isWarning,
    message,
  };
}

/**
 * Download QR code as PNG image
 */
export function downloadQrCode(
  svgElement: SVGSVGElement,
  filename: string = "contact-qr.png",
  size: number = 512
): void {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(svgUrl);
      return;
    }

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Draw QR code
    ctx.drawImage(img, 0, 0, size, size);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      URL.revokeObjectURL(svgUrl);
    }, "image/png");
  };

  img.src = svgUrl;
}

/**
 * Get a sanitized filename from contact name
 */
export function getQrFilename(firstName?: string, lastName?: string): string {
  const name = [firstName, lastName].filter(Boolean).join("-") || "contact";
  const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `${sanitized}-qr.png`;
}
