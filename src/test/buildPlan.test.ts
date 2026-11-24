import { describe, expect, it } from 'vitest';
import { appBuildPlan } from '../../scripts/build-plan.mjs';
import { qaLoadDiagnosticsEnabled } from '../../scripts/qa-load-diagnostics-config.mjs';

const qa = { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'qa' };
describe('automatic QA build mode', () => {
  it('restores QA mode and diagnostic opt-in only for QA Preview', () => {
    expect(appBuildPlan([], qa)).toEqual({ args: ['--mode', 'qa'], qaPreview: true });
    expect(qaLoadDiagnosticsEnabled('qa', { ...qa, ZIPCO_QA_LOAD_DIAGNOSTICS: '1' })).toBe(true);
  });
  it.each(['main', 'feature/design', undefined])('preserves other preview branches (%s)', branch => {
    expect(appBuildPlan([], { ...qa, VERCEL_GIT_COMMIT_REF: branch })).toEqual({ args: [], qaPreview: false });
  });
  it.each(['production', 'development', undefined])('preserves other deployment targets (%s)', target => {
    expect(appBuildPlan([], { ...qa, VERCEL_ENV: target })).toEqual({ args: [], qaPreview: false });
  });
  it('leaves ordinary local builds and explicit QA builds untouched', () => {
    expect(appBuildPlan([], {})).toEqual({ args: [], qaPreview: false });
    expect(appBuildPlan(['--mode', 'qa'], {})).toEqual({ args: ['--mode', 'qa'], qaPreview: false });
  });
  it.each([['--mode', 'production'], ['--mode=production']])('respects explicit production mode %j', (...args) => {
    expect(appBuildPlan(args, qa)).toEqual({ args, qaPreview: false });
  });
  it('preserves output directory arguments', () => {
    expect(appBuildPlan(['--outDir', 'test-output'], qa)).toEqual({ args: ['--outDir', 'test-output', '--mode', 'qa'], qaPreview: true });
  });
});
