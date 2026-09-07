import { describe, expect, it } from 'vitest';
import { isDevAccount, resolveDevAuthConfig } from './devAuthConfig';

const valid = {
  isDev: true,
  enabled: 'true',
  apiUrl: 'http://127.0.0.1:3000',
  key: 'local-test-key'
};

describe('dev auth configuration', () => {
  it('enables only the exact local configuration', () => {
    expect(resolveDevAuthConfig(valid)).toEqual({
      state: 'enabled', apiOrigin: 'http://127.0.0.1:3000', key: 'local-test-key'
    });
    expect(resolveDevAuthConfig({ ...valid, apiUrl: 'http://localhost:3000/' }).state).toBe('enabled');
  });

  it('is disabled outside Vite development mode', () => {
    expect(resolveDevAuthConfig({ ...valid, isDev: false })).toEqual({ state: 'disabled' });
  });

  it('is disabled when the flag is false or absent', () => {
    expect(resolveDevAuthConfig({ ...valid, enabled: 'false' })).toEqual({ state: 'disabled' });
    expect(resolveDevAuthConfig({ ...valid, enabled: undefined })).toEqual({ state: 'disabled' });
  });

  it.each([
    'https://zipco-backend-production.up.railway.app',
    'http://127.0.0.1:3001',
    'https://127.0.0.1:3000',
    'http://192.168.1.20:3000',
    'http://127.0.0.1:3000/api',
    'not-a-url'
  ])('fails closed for the API URL %s', (apiUrl) => {
    expect(resolveDevAuthConfig({ ...valid, apiUrl })).toEqual({ state: 'misconfigured' });
  });

  it('fails closed for a missing or padded key', () => {
    expect(resolveDevAuthConfig({ ...valid, key: '' })).toEqual({ state: 'misconfigured' });
    expect(resolveDevAuthConfig({ ...valid, key: ' padded ' })).toEqual({ state: 'misconfigured' });
  });

  it('accepts only the four closed aliases', () => {
    expect(isDevAccount('customer')).toBe(true);
    expect(isDevAccount('business-owner')).toBe(true);
    expect(isDevAccount('unrelated-user')).toBe(true);
    expect(isDevAccount('admin')).toBe(true);
    expect(isDevAccount('owner')).toBe(false);
    expect(isDevAccount(2)).toBe(false);
  });
});
