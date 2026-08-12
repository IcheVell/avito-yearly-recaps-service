export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(record: UnknownRecord, key: string): string | null {
  return typeof record[key] === 'string' ? record[key] : null;
}

export function readNumber(record: UnknownRecord, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readInteger(record: UnknownRecord, key: string): number | null {
  const value = readNumber(record, key);
  return value !== null && Number.isSafeInteger(value) ? value : null;
}

export function readNullableNumber(
  record: UnknownRecord,
  key: string,
): number | null {
  return record[key] === null ? null : readNumber(record, key);
}

export function readNullableString(
  record: UnknownRecord,
  key: string,
): string | null {
  return record[key] === null ? null : readString(record, key);
}

export function parseArray<T>(
  value: unknown,
  parser: (item: unknown) => T | null,
): T[] {
  return Array.isArray(value)
    ? value.map(parser).filter((item): item is T => item !== null)
    : [];
}

export function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export function parseIntegerArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is number =>
          typeof item === 'number' && Number.isSafeInteger(item),
      )
    : [];
}
