const DEFAULT_MAX_LENGTH = 140;

/** Truncate card body copy at a word boundary. */
export function truncateText(
  text: string,
  maxLength = DEFAULT_MAX_LENGTH,
): string {
  const normalized = text.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const slice = normalized.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut =
    lastSpace > Math.floor(maxLength * 0.55)
      ? slice.slice(0, lastSpace)
      : slice;

  return `${cut.trimEnd()}…`;
}
