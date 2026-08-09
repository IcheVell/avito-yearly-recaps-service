import type { MetricPayload } from './types';

export function getPayloadString(
  payload: MetricPayload,
  key: string,
): string | undefined {
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
}
