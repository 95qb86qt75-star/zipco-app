// Opt-in QA builds only. A production deployment always overrides the opt-in.
export function qaLoadDiagnosticsEnabled(mode, env) {
  return mode === 'qa' && env.ZIPCO_QA_LOAD_DIAGNOSTICS === '1' &&
    env.VERCEL_ENV !== 'production' &&
    (!env.VERCEL || (env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === 'qa'));
}
