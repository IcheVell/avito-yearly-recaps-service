export function getShareTokenFromPath(pathname: string): string | null {
  const match = /^\/share\/([^/]+)$/.exec(pathname);
  if (!match) {
    return null;
  }

  const raw = match[1]?.trim() ?? '';
  if (!raw) {
    return null;
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
