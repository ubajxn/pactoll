import { APIError } from "better-auth/api";

export const AVATAR_SIZE = 72;
export const MAX_AVATAR_BYTES = 24 * 1024;
const DATA_URL_PREFIX = "data:image/webp;base64,";

function badAvatar(message: string): never {
  throw new APIError("BAD_REQUEST", { message });
}

function webpDimensions(bytes: Buffer) {
  if (
    bytes.length < 30 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP" ||
    bytes.readUInt32LE(4) + 8 !== bytes.length
  )
    return null;

  for (let offset = 12; offset + 8 <= bytes.length; ) {
    const kind = bytes.toString("ascii", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + length > bytes.length) return null;
    if (kind === "VP8X" && length >= 10)
      return {
        width: 1 + bytes.readUIntLE(start + 4, 3),
        height: 1 + bytes.readUIntLE(start + 7, 3),
      };
    if (kind === "VP8L" && length >= 5 && bytes[start] === 0x2f) {
      const b1 = bytes[start + 1];
      const b2 = bytes[start + 2];
      const b3 = bytes[start + 3];
      const b4 = bytes[start + 4];
      return {
        width: 1 + (((b2 & 0x3f) << 8) | b1),
        height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | (b2 >> 6)),
      };
    }
    if (
      kind === "VP8 " &&
      length >= 10 &&
      bytes[start + 3] === 0x9d &&
      bytes[start + 4] === 0x01 &&
      bytes[start + 5] === 0x2a
    )
      return {
        width: bytes.readUInt16LE(start + 6) & 0x3fff,
        height: bytes.readUInt16LE(start + 8) & 0x3fff,
      };
    offset = start + length + (length % 2);
  }
  return null;
}

/** Better Auth persists this value directly in the user's nullable image column. */
export function validatedAvatar(value: string | null | undefined) {
  if (value === undefined || value === null) return value;
  if (!value.startsWith(DATA_URL_PREFIX))
    badAvatar("Avatar must be a 72px WebP image");
  const encoded = value.slice(DATA_URL_PREFIX.length);
  if (
    encoded.length === 0 ||
    encoded.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
  )
    badAvatar("Avatar image is invalid");
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.length > MAX_AVATAR_BYTES)
    badAvatar("Avatar image must be smaller than 24 KB");
  const dimensions = webpDimensions(bytes);
  if (dimensions?.width !== AVATAR_SIZE || dimensions.height !== AVATAR_SIZE)
    badAvatar("Avatar must be a 72px square WebP image");
  return value;
}
