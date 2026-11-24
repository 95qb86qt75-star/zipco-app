// Read-only. Never creates deployments, bypasses, variables, aliases or tokens.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { QA, validatePublicationTarget, verifyQaPublication } from './qa/publication.mjs';
import { createTiming } from './qa/timing.mjs';

const options = { base: QA.base, jsContains: [], cssContains: [] };
for (let i = 2; i < process.argv.length; i++) {
  const flag = process.argv[i], value = process.argv[++i];
  if (!['--sha', '--deployment', '--base', '--auth-file', '--contains-js', '--contains-css'].includes(flag) || !value || value.startsWith('--'))
    throw Error('Invalid verification option');
  if (flag === '--contains-js') options.jsContains.push(value);
  else if (flag === '--contains-css') options.cssContains.push(value);
  else options[{ '--sha': 'sha', '--deployment': 'deployment', '--base': 'base', '--auth-file': 'authFile' }[flag]] = value;
}
validatePublicationTarget(options); // Before credential lookup or any network access.
const authFile = options.authFile ?? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData/Roaming'), 'com.vercel.cli/Data/auth.json');
let token;
try { token = JSON.parse(fs.readFileSync(authFile, 'utf8')).token; }
catch { throw Error('Existing Vercel auth unavailable; credentials are not logged'); }
const timing = createTiming('read-only QA publication verification');
try {
  const result = await timing.measure('existing publication read/verification', () => verifyQaPublication({ ...options, token }));
  const directory = path.resolve('node_modules/.cache/qa-pilot/publication');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  timing.save('node_modules/.cache/qa-pilot/publication/timing.json');
}
