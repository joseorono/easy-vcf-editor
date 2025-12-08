export const BASE64_IMAGE_DATA_URI_REGEX =
  /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/i;

export const DATA_URI_BASE64_SEPARATOR_REGEX = /;base64,([\s\S]+)$/i;

export const DATA_URI_MIME_TYPE_REGEX = /^data:([^;]+)/i;

export const DEFAULT_IMAGE_MIME_TYPE = "image/jpeg" as const;
