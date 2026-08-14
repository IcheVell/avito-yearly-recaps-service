export function toRootRelativeUrl(
  url: string | null | undefined,
): string | null {
  if (url == null) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (
    /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(trimmed) ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  return `/${trimmed}`;
}
