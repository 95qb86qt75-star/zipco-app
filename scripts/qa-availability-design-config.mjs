// Only the QA branch's Preview deployments (or an explicit local QA build).
// The new workflow remains a presentation-only entry, never a production route.
export function qaAvailabilityDesignEnabled(mode, env) {
  if (env.VERCEL_ENV === 'production') return false;
  if (env.VERCEL) return env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === 'qa';
  return mode === 'qa';
}
