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
