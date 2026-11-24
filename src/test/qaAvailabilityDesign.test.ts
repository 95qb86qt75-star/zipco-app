import { describe, expect, it } from 'vitest';
import { qaAvailabilityDesignEnabled } from '../../scripts/qa-availability-design-config.mjs';

describe('availability design build boundary', () => {
  it.each(['production', 'qa', 'development'])('never enables in a production deployment (%s)', mode => {
    expect(qaAvailabilityDesignEnabled(mode, { VERCEL: '1', VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'qa' })).toBe(false);
  });
  it.each(['production', 'qa'])('allows the qa Preview branch (%s)', mode => {
    expect(qaAvailabilityDesignEnabled(mode, { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'qa' })).toBe(true);
  });
  it.each(['main', 'feature/design', undefined])('rejects other Preview branches (%s)', branch => {
    expect(qaAvailabilityDesignEnabled('qa', { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: branch })).toBe(false);
  });
  it('requires explicit local QA mode', () => {
    expect(qaAvailabilityDesignEnabled('qa', {})).toBe(true);
    expect(qaAvailabilityDesignEnabled('production', {})).toBe(false);
    expect(qaAvailabilityDesignEnabled('development', {})).toBe(false);
  });
  it('fails closed with incomplete Vercel deployment context', () => {
    expect(qaAvailabilityDesignEnabled('qa', { VERCEL: '1' })).toBe(false);
  });
});
