import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { appBuildPlan } from './build-plan.mjs';

const plan = appBuildPlan(process.argv.slice(2), process.env);
const env = { ...process.env };
if (plan.qaPreview) {
  env.ZIPCO_QA_LOAD_DIAGNOSTICS = '1';
  // Temporary QA-only evidence for external notification clicks. Vite excludes
  // the panel/store/worker instrumentation from production builds.
  env.ZIPCO_QA_NOTIFICATION_TRACE = '1';
}
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'build', ...plan.args], {
  env, stdio: 'inherit', windowsHide: true,
});
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
