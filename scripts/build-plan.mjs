// Preserve explicit build modes. Automatic QA Preview builds need the same
// mode and diagnostic opt-in as the previously published QA builds.
export function appBuildPlan(args, env) {
  const qaPreview = env.VERCEL === '1' && env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === 'qa';
  const index = args.indexOf('--mode');
  const inlineMode = args.find(argument => argument.startsWith('--mode='));
  const explicitMode = index >= 0 ? args[index + 1] : inlineMode?.slice('--mode='.length);
  const useQa = qaPreview && (!explicitMode || explicitMode === 'qa');
  return {
    args: useQa && !explicitMode ? [...args, '--mode', 'qa'] : [...args],
    qaPreview: useQa,
  };
}
