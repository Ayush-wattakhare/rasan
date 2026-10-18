/**
 * Raster images only. SVG is rejected: it can carry script and would be served
 * from a public bucket on our storage domain (stored XSS).
 */
export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Returns the file extension to store under, or null if the file is not allowed. */
export function imageExtensionFor(file: { type: string; size: number }): string | null {
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return null;
  return IMAGE_EXTENSIONS[file.type] ?? null;
}

export type SniffedImage = { mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'; ext: string };

/**
 * Detects the real image type from the file's first bytes. The browser-sent
 * `file.type` is attacker-controlled, so uploads must use this instead.
 */
export function sniffImageType(bytes: Uint8Array): SniffedImage | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // WEBP
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) {
    return { mime: 'image/gif', ext: 'gif' };
  }
  return null;
}
