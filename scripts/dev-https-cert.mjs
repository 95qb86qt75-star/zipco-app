// Local development only: self-signed certificate so the Vite dev server can be
// opened from phones over HTTPS (https://<LAN IP>:5175). Plain http://<IP> is
// not a secure context, so browsers hide crypto.randomUUID / crypto.subtle /
// geolocation and order creation fails before reaching the API.
// The certificate lives in .cert/ (git-ignored) and is regenerated when the
// machine's private IPv4 addresses change. Never used by builds or Vercel.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';

const PRIVATE_IPV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

export function privateIpv4Addresses() {
  return Object.values(networkInterfaces()).flat()
    .filter((entry) => entry && entry.family === 'IPv4' && !entry.internal && PRIVATE_IPV4.test(entry.address))
    .map((entry) => entry.address)
    .sort();
}

function opensslCandidates() {
  const programFiles = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(Boolean);
  return ['openssl', ...programFiles.flatMap((dir) => [
    path.join(dir, 'Git', 'usr', 'bin', 'openssl.exe'),
    path.join(dir, 'Git', 'mingw64', 'bin', 'openssl.exe'),
  ])];
}

function runOpenssl(args) {
  for (const bin of opensslCandidates()) {
    if (bin !== 'openssl' && !existsSync(bin)) continue;
    try { execFileSync(bin, args, { stdio: 'pipe', windowsHide: true }); return; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  throw new Error('[dev-https] openssl not found (install Git for Windows or add openssl to PATH).');
}

export function ensureDevHttpsCert(root) {
  const dir = path.join(root, '.cert');
  const keyFile = path.join(dir, 'dev-key.pem');
  const certFile = path.join(dir, 'dev-cert.pem');
  const hostsFile = path.join(dir, 'hosts.json');
  const ips = ['127.0.0.1', ...privateIpv4Addresses()];
  const wanted = JSON.stringify(ips);
  const current = existsSync(hostsFile) ? readFileSync(hostsFile, 'utf8') : '';
  if (current !== wanted || !existsSync(keyFile) || !existsSync(certFile)) {
    mkdirSync(dir, { recursive: true });
    const san = ['DNS:localhost', ...ips.map((ip) => `IP:${ip}`)].join(',');
    runOpenssl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '825',
      '-keyout', keyFile, '-out', certFile, '-subj', '/CN=ZIPCO local dev', '-addext', `subjectAltName=${san}`]);
    writeFileSync(hostsFile, wanted);
    console.log(`[dev-https] Certificate created for localhost, ${ips.join(', ')}`);
  }
  return { key: readFileSync(keyFile), cert: readFileSync(certFile), ips };
}
