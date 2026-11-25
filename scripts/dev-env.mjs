// Starts Vite reading only the env files listed before `--`, in order (later
// files override earlier ones). Vite's own .env/.env.local/.env.[mode] loading
// is disabled for this run, so .env.local cannot silently override them.
// Variables already set in the shell keep priority, as with Vite.
//   node scripts/dev-env.mjs .env -- [vite args]
//   node scripts/dev-env.mjs .env .env.prod -- --mode prod
// A leading `local` after `--` (`npm run dev local`) first overwrites .env with
// the contents of .env.local, then starts normally.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const argv = process.argv.slice(2);
const split = argv.indexOf('--');
const files = split >= 0 ? argv.slice(0, split) : argv;
const viteArgs = split >= 0 ? argv.slice(split + 1) : [];

if (viteArgs[0] === 'local') {
  viteArgs.shift();
  if (!existsSync('.env.local')) { console.error('[dev-env] Missing env file: .env.local'); process.exit(1); }
  copyFileSync('.env.local', '.env');
  console.log('[dev-env] Copied .env.local → .env');
}

// `lan` (npm run dev:lan): HTTPS dev server reachable from phones on the LAN.
// `lan-pwa` (npm run dev:lan:pwa): QA-mode build served over HTTPS with its
// service worker, to test install + Web Push against the local backend.
const LAN_PWA_OUT = 'node_modules/.cache/zipco-lan-pwa';
let lan = {};
let steps = [viteArgs];
if (viteArgs[0] === 'lan') {
  viteArgs.splice(0, 1, '--host', '0.0.0.0', '--port', '5175');
  lan = { ZIPCO_DEV_HTTPS: '1' };
} else if (viteArgs[0] === 'lan-pwa') {
  const rest = viteArgs.slice(1);
  steps = [
    ['build', '--mode', 'qa', '--outDir', LAN_PWA_OUT, '--emptyOutDir', ...rest],
    ['preview', '--mode', 'qa', '--outDir', LAN_PWA_OUT, '--host', '0.0.0.0', '--port', '5176', '--strictPort'],
  ];
  lan = { ZIPCO_DEV_HTTPS: '1' };
}

const fromFiles = {};
for (const file of files) {
  if (!existsSync(file)) { console.error(`[dev-env] Missing env file: ${file}`); process.exit(1); }
  Object.assign(fromFiles, parseEnv(readFileSync(file, 'utf8')));
}
const viteKeys = Object.keys(fromFiles).filter(key => key.startsWith('VITE_'));
console.log(`[dev-env] Env files: ${files.join(', ') || '(none)'} → ${viteKeys.join(', ') || 'no VITE_ variables'}`);

const env = { ...fromFiles, ...process.env, ...lan, ZIPCO_ENV_FILES_ONLY: '1' };
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
for (const args of steps) {
  const result = spawnSync(process.execPath, [vite, ...args], { env, stdio: 'inherit', windowsHide: true });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
