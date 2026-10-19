import { watch } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build, preview } from 'vite';
import { LOCAL_QA_BACKEND, LOCAL_QA_PORT, selectLanAddress, localQaOverrides, checkLocalQaCors } from './local-qa-preview-config.mjs';

export async function startLocalQaPreview() {
  Object.assign(process.env, localQaOverrides());
  const projectRoot = fileURLToPath(new URL('../', import.meta.url));
  const buildDirectory = path.resolve(projectRoot, 'node_modules/.cache/zipco-local-qa-build');
  const cacheRoot = path.resolve(projectRoot, 'node_modules/.cache');
  // Vite clears only this generated cache, never dist, source or documents.
  if (path.dirname(buildDirectory) !== cacheRoot || path.basename(buildDirectory) !== 'zipco-local-qa-build') {
    throw new Error('Directorio de compilación local inesperado.');
  }
  const host = selectLanAddress(networkInterfaces(), process.env.ZIPCO_LOCAL_PREVIEW_HOST);
  const origin = `http://${host}:${LOCAL_QA_PORT}`;
  const configFile = path.join(projectRoot, 'vite.config.ts');
  const buildOptions = { root: projectRoot, configFile, mode: 'qa',
    build: { outDir: buildDirectory, emptyOutDir: true },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(LOCAL_QA_BACKEND),
      'import.meta.env.VITE_ENABLE_QA_AUTH': JSON.stringify('true'),
      'import.meta.env.VITE_ENABLE_DEV_AUTH': JSON.stringify('false'),
      'import.meta.env.VITE_DEV_AUTH_KEY': JSON.stringify(''),
    },
  };
  console.log('Preparando ZIPCO local. Backend exclusivo: QA. No usa Vercel.');
  await build(buildOptions);
  const server = await preview({ root: projectRoot, configFile, mode: 'qa',
    build: { outDir: buildDirectory },
    preview: { host, port: LOCAL_QA_PORT, strictPort: true, open: false, cors: false },
  });
  console.log(`\nABRIR EN COMPUTADOR Y CELULARES: ${origin}/`);
  console.log('Usa el mismo Wi-Fi. No necesitas instalar una app en el celular.');
  console.log('Mantén esta ventana abierta. Después de cada reconstrucción, actualiza el navegador.');
  const cors = await checkLocalQaCors(origin);
  console.log(cors.originAllowed
    ? 'Backend QA permite este origen. Usa tu clave QA habitual en la página, sin enviarla al chat.'
    : `PENDIENTE BACKEND QA: autorizar el origen ${origin}. La página abre, pero el acceso QA no está listo. Ver docs/frontend-local-qa-preview.md.`);

  let timer;
  let building = false;
  let requested = false;
  let stopped = false;
  const rebuild = async () => {
    requested = true;
    if (building || stopped) return;
    building = true;
    try {
      while (requested && !stopped) {
        requested = false;
        console.log('\nReconstruyendo cambios locales...');
        try {
          await build(buildOptions);
          console.log(`LISTO: actualiza ${origin}/ en el navegador.`);
        } catch {
          console.error('No se pudo reconstruir. Revisa el error del compilador; la siguiente edición volverá a intentarlo.');
        }
      }
    } finally { building = false; }
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => { void rebuild(); }, 500); };
  const watchers = ['src', 'public'].map((directory) => watch(path.join(projectRoot, directory), { recursive: true }, schedule));
  watchers.push(watch(projectRoot, (_event, filename) => {
    if (['index.html', 'vite.config.ts', 'package.json'].includes(String(filename))) schedule();
  }));
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    watchers.forEach((watcher) => watcher.close());
    server.httpServer.closeAllConnections?.();
    server.httpServer.close();
  };
  process.once('SIGINT', () => { stop(); process.exit(0); });
  process.once('SIGTERM', () => { stop(); process.exit(0); });
  return { origin, stop, cors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startLocalQaPreview().catch((error) => {
    console.error(`No se pudo abrir la vista local: ${error.message}`);
    process.exitCode = 1;
  });
}
