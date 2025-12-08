import {
  BASE64_IMAGE_DATA_URI_REGEX,
  DATA_URI_BASE64_SEPARATOR_REGEX,
  DATA_URI_MIME_TYPE_REGEX,
  DEFAULT_IMAGE_MIME_TYPE,
} from "@/constants/base64-constants";

/**
 * Validates if a string is a valid base64-encoded data URI.
 * Supports common image MIME types: jpeg, png, gif, webp, svg+xml
 */
export function isValidBase64DataUri(value: string): boolean {
  if (typeof value !== "string") return false;
  if (!value.startsWith("data:")) return false;

  return BASE64_IMAGE_DATA_URI_REGEX.test(value);
}

/**
 * Validates if a string is a valid image URL.
 * Accepts http:// and https:// URLs.
 */
export function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates if a string is either a valid image URL or base64 data URI.
 */
export function isValidImageSource(value: string): boolean {
  if (!value) return true; // Empty is valid (optional field)
  return isValidImageUrl(value) || isValidBase64DataUri(value);
}

/**
 * Converts a File or Blob to a base64 data URI.
 * @param file - The file or blob to convert
 * @returns Promise resolving to the base64 data URI
 */
export async function fileToBase64DataUri(
  file: File | Blob
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // FileReader returns data:mime;base64,... format already
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts the base64 string from a data URI.
 * @param dataUri - The data URI (e.g., "data:image/png;base64,...")
 * @returns The base64 string without the prefix
 */
export function extractBase64FromDataUri(dataUri: string): string {
  const match = dataUri.match(DATA_URI_BASE64_SEPARATOR_REGEX);
  return match ? match[1] : "";
}

/**
 * Extracts the MIME type from a data URI.
 * @param dataUri - The data URI (e.g., "data:image/png;base64,...")
 * @returns The MIME type (e.g., "image/png")
 */
export function extractMimeTypeFromDataUri(dataUri: string): string {
  const match = dataUri.match(DATA_URI_MIME_TYPE_REGEX);
  return match ? match[1] : DEFAULT_IMAGE_MIME_TYPE;
}

/**
 * Validates the size of a base64 data URI.
 * @param dataUri - The data URI to check
 * @param maxSizeKb - Maximum allowed size in kilobytes (default: 1024 = 1MB)
 * @returns true if the data URI is within the size limit
 */
export function isBase64DataUriWithinSize(
  dataUri: string,
  maxSizeKb: number = 1024
): boolean {
  if (!isValidBase64DataUri(dataUri)) return false;

  const base64String = extractBase64FromDataUri(dataUri);
  if (!base64String) return false;

  // More accurate calculation: (len * 3) / 4 - padding
  const padding = base64String.endsWith("==")
    ? 2
    : base64String.endsWith("=")
    ? 1
    : 0;
  const sizeBytes = (base64String.length * 3) / 4 - padding;
  const sizeKb = sizeBytes / 1024;

  return sizeKb <= maxSizeKb;
}
