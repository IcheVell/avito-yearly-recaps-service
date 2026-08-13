import { env } from '../config/env';

type ToAppUrlOptions = {
  pageOrigin?: string;
  publicOrigin?: string;
};

function isLocalHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0'
  );
}

export function getAppOrigin({
  pageOrigin = window.location.origin,
  publicOrigin = env.publicOrigin,
}: ToAppUrlOptions = {}): string {
  const configured = (publicOrigin ?? '').trim().replace(/\/$/, '');
  if (configured) {
    return configured;
  }

  return pageOrigin.replace(/\/$/, '');
}

export function toAppUrl(
  pathOrUrl: string,
  options: ToAppUrlOptions = {},
): string {
  const origin = getAppOrigin(options);
  const trimmed = pathOrUrl.trim() || '/';
  const resolved = new URL(trimmed, `${origin}/`);
  const originUrl = new URL(origin);

  if (
    isLocalHostname(resolved.hostname) &&
    !isLocalHostname(originUrl.hostname)
  ) {
    resolved.protocol = originUrl.protocol;
    resolved.hostname = originUrl.hostname;
    resolved.port = originUrl.port;
  }

  return resolved.toString();
}
