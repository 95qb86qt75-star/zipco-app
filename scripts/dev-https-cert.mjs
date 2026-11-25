// Local development only: HTTPS for the Vite dev/preview server so phones can
// open it over the LAN (https://<LAN IP>:5175 / :5176). Plain http://<IP> is not
// a secure context, so browsers hide crypto.randomUUID / crypto.subtle /
// geolocation / service workers.
//
// A local CA ("ZIPCO Local Dev CA") signs a short-lived server certificate.
// Installing the CA on a phone makes the site trusted, which service workers
// and Web Push require. The CA is name-constrained to localhost and private
// IPv4 ranges, so it cannot vouch for any public site.
// Everything lives in .cert/ (git-ignored). The server certificate is
// regenerated when the machine's private IPv4 addresses change; the CA stays.
// Never used by builds or Vercel.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';

const PRIVATE_IPV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
const LAYOUT_VERSION = 2;
export const CA_DOWNLOAD_PATH = '/zipco-local-ca.crt';

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

function ensureCa(dir) {
  const caKey = path.join(dir, 'ca-key.pem');
  const caCert = path.join(dir, 'ca-cert.pem');
  if (existsSync(caKey) && existsSync(caCert)) return { caKey, caCert, created: false };
  const constraints = [
    'permitted;DNS:localhost',
    'permitted;IP:127.0.0.0/255.0.0.0',
    'permitted;IP:10.0.0.0/255.0.0.0',
    'permitted;IP:172.16.0.0/255.240.0.0',
    'permitted;IP:192.168.0.0/255.255.0.0',
  ].join(',');
  runOpenssl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '825',
    '-keyout', caKey, '-out', caCert, '-subj', '/CN=ZIPCO Local Dev CA',
    '-addext', 'basicConstraints=critical,CA:TRUE,pathlen:0',
    '-addext', 'keyUsage=critical,keyCertSign,cRLSign',
    '-addext', `nameConstraints=critical,${constraints}`]);
  console.log('[dev-https] Local CA created (.cert/ca-cert.pem)');
  return { caKey, caCert, created: true };
}

export function ensureDevHttpsCert(root) {
  const dir = path.join(root, '.cert');
  mkdirSync(dir, { recursive: true });
  const { caKey, caCert, created } = ensureCa(dir);
  const keyFile = path.join(dir, 'dev-key.pem');
  const certFile = path.join(dir, 'dev-cert.pem');
  const stateFile = path.join(dir, 'hosts.json');
  const ips = ['127.0.0.1', ...privateIpv4Addresses()];
  const wanted = JSON.stringify({ v: LAYOUT_VERSION, ips });
  const current = existsSync(stateFile) ? readFileSync(stateFile, 'utf8') : '';
  if (created || current !== wanted || !existsSync(keyFile) || !existsSync(certFile)) {
    const csr = path.join(dir, 'dev.csr');
    const ext = path.join(dir, 'dev-ext.cnf');
    const san = ['DNS:localhost', ...ips.map((ip) => `IP:${ip}`)].join(',');
    writeFileSync(ext, [
      'basicConstraints=critical,CA:FALSE',
      'keyUsage=critical,digitalSignature,keyEncipherment',
      'extendedKeyUsage=serverAuth',
      `subjectAltName=${san}`,
    ].join('\n') + '\n');
    runOpenssl(['req', '-newkey', 'rsa:2048', '-nodes', '-sha256',
      '-keyout', keyFile, '-out', csr, '-subj', '/CN=ZIPCO local dev']);
    runOpenssl(['x509', '-req', '-in', csr, '-CA', caCert, '-CAkey', caKey, '-CAcreateserial',
      '-out', certFile, '-days', '397', '-sha256', '-extfile', ext]);
    rmSync(csr, { force: true });
    writeFileSync(stateFile, wanted);
    console.log(`[dev-https] Server certificate created for localhost, ${ips.join(', ')}`);
  }
  return { key: readFileSync(keyFile), cert: readFileSync(certFile), caCertPem: readFileSync(caCert, 'utf8'), ips };
}

// DER bytes of the CA so phones can download and install it.
export function caCertDer(caCertPem) {
  const base64 = caCertPem.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s+/g, '');
  return Buffer.from(base64, 'base64');
}

// Vite plugin: serves the CA at CA_DOWNLOAD_PATH on the dev and preview servers.
export function devCaDownloadPlugin(caCertPem) {
  const body = caCertDer(caCertPem);
  const middleware = (req, res, next) => {
    if (req.url?.split('?')[0] !== CA_DOWNLOAD_PATH) return next();
    res.setHeader('Content-Type', 'application/x-x509-ca-cert');
    res.setHeader('Content-Disposition', 'attachment; filename="zipco-local-ca.crt"');
    res.setHeader('Cache-Control', 'no-store');
    res.end(body);
  };
  return {
    name: 'zipco-dev-ca-download',
    apply: () => true,
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
