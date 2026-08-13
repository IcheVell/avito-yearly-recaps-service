import { describe, expect, it } from 'vitest';

import { getShareTokenFromPath } from '../../../src/pages/ShareRecapPage/getShareTokenFromPath';

describe('getShareTokenFromPath', () => {
  it('достаёт токен из share-роута', () => {
    expect(getShareTokenFromPath('/share/abc123')).toBe('abc123');
  });

  it('игнорирует другие пути', () => {
    expect(getShareTokenFromPath('/')).toBeNull();
    expect(getShareTokenFromPath('/share/')).toBeNull();
    expect(getShareTokenFromPath('/users/1/recap')).toBeNull();
  });
});
