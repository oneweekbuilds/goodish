/**
 * Canonical scan ID generator — single source of truth.
 * Imported by both background.js and desktop_mapper.js.
 */
export function generateScanId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `scan_${timestamp}_${random}`;
}
