import { describe, expect, it } from 'vitest';

import { toAppUrl } from '../../../src/shared/lib/appUrl';

describe('toAppUrl', () => {
  it('resolves a relative share path against the current page origin', () => {
    expect(
      toAppUrl('/share/abc123', { pageOrigin: 'https://recaps.example' }),
    ).toBe('https://recaps.example/share/abc123');
  });

  it('replaces a localhost share url with the public page origin', () => {
    expect(
      toAppUrl('http://localhost/share/abc123', {
        pageOrigin: 'https://recaps.example',
      }),
    ).toBe('https://recaps.example/share/abc123');
    expect(
      toAppUrl('http://127.0.0.1:5173/share/abc123', {
        pageOrigin: 'http://95.1.2.3',
      }),
    ).toBe('http://95.1.2.3/share/abc123');
  });

  it('keeps localhost when the page itself is local', () => {
    expect(
      toAppUrl('/share/abc123', { pageOrigin: 'http://localhost:5173' }),
    ).toBe('http://localhost:5173/share/abc123');
  });

  it('prefers a configured public origin over localhost', () => {
    expect(
      toAppUrl('/share/abc123', {
        pageOrigin: 'http://localhost',
        publicOrigin: 'https://recaps.example',
      }),
    ).toBe('https://recaps.example/share/abc123');
    expect(
      toAppUrl('/', {
        pageOrigin: 'http://localhost',
        publicOrigin: 'https://recaps.example',
      }),
    ).toBe('https://recaps.example/');
  });
});
