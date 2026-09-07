import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const distDirectory = new URL('../dist/', import.meta.url);
const exclusiveMarkers = [
  '/dev/auth/session',
  'X-Dev-Auth-Key',
  'Acceso de desarrollo',
  'business-owner',
  'unrelated-user',
  '@zipco.local',
  'ZIPCO_DEV_UNAVAILABLE_FIXTURE_ONLY',
  'Revisar Estado no disponible'
];

const sentinel = process.env.VITE_DEV_AUTH_KEY;
if (!sentinel || sentinel.length < 16) {
  throw new Error('Production verification requires a synthetic sentinel key of at least 16 characters.');
}

async function filesRecursively(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const location = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...await filesRecursively(location));
    else if (/\.(?:js|css|html)$/i.test(entry.name)) files.push(location);
  }
  return files;
}

const forbidden = [...exclusiveMarkers, sentinel];
const violations = [];
for (const file of await filesRecursively(distDirectory)) {
  const contents = await readFile(file, 'utf8');
  if (forbidden.some((marker) => contents.includes(marker))) {
    violations.push(path.basename(file.pathname));
  }
}

if (violations.length > 0) {
  throw new Error(`Development-only content found in production output files: ${violations.join(', ')}`);
}

console.log('Production bundle contains no Dev Auth markers or sentinel key.');
