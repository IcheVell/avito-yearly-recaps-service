import { describe, expect, it } from 'vitest';

import { toRootRelativeUrl } from '../../../src/shared/lib/toRootRelativeUrl';

describe('toRootRelativeUrl', () => {
  it('adds a leading slash to relative asset paths', () => {
    expect(toRootRelativeUrl('static/achievements/diplomat.png')).toBe(
      '/static/achievements/diplomat.png',
    );
  });

  it('keeps root-relative and absolute urls', () => {
    expect(toRootRelativeUrl('/static/achievements/diplomat.png')).toBe(
      '/static/achievements/diplomat.png',
    );
    expect(toRootRelativeUrl('https://cdn.example/a.png')).toBe(
      'https://cdn.example/a.png',
    );
  });

  it('returns null for empty values', () => {
    expect(toRootRelativeUrl(null)).toBeNull();
    expect(toRootRelativeUrl('')).toBeNull();
  });
});
