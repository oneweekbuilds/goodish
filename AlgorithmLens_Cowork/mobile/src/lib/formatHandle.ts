/**
 * formatHandle — render a creator handle with exactly one leading "@".
 *
 * Strips any number of leading "@" characters and prepends a single one.
 * Centralizes the rendering so we never produce "@@handle" when the data
 * layer already includes "@" in the stored handle. Returns "" for empty
 * input so call-sites can fall back to a placeholder if they need to.
 */
export function formatHandle(handle: string | null | undefined): string {
  if (!handle) return '';
  const stripped = String(handle).trim().replace(/^@+/, '');
  if (!stripped) return '';
  return `@${stripped}`;
}
