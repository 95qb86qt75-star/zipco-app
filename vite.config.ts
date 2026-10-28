import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { qaLoadDiagnosticsEnabled } from './scripts/qa-load-diagnostics-config.mjs'
import { qaAvailabilityDesignEnabled } from './scripts/qa-availability-design-config.mjs'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const diagnostics = qaLoadDiagnosticsEnabled(mode, process.env);
  const clickTrace = diagnostics && process.env.ZIPCO_QA_NOTIFICATION_TRACE === '1';
  let diagnosticVersion = 'unknown';
  if (diagnostics) {
    const sha = process.env.VERCEL_GIT_COMMIT_SHA;
    if (sha && /^[a-f0-9]{40}$/.test(sha)) diagnosticVersion = sha;
    else {
      try { diagnosticVersion = `${execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}-local`; }
      catch { /* No invented version when Git metadata is unavailable. */ }
    }
  }
  return {
  define: {
    'import.meta.env.QA_LOAD_DIAGNOSTICS': JSON.stringify(diagnostics),
    'import.meta.env.QA_LOAD_DIAGNOSTICS_VERSION': JSON.stringify(diagnosticVersion),
    'import.meta.env.QA_NOTIFICATION_TRACE': JSON.stringify(clickTrace),
    'import.meta.env.QA_AVAILABILITY_DESIGN': JSON.stringify(qaAvailabilityDesignEnabled(mode, process.env)),
  },
  plugins: [
    ...(clickTrace ? [{
      name: 'qa-only-notification-click-trace',
      generateBundle() {
        const shared = readFileSync(path.resolve(__dirname, 'src/app/notifications/qaNotificationClickTraceStore.js'), 'utf8').replace(/^export /gm, '');
        this.emitFile({ type: 'asset', fileName: 'qa-notification-click-trace.js', source:
          `(() => {\n${shared}\nself.zipcoQaClickTrace = createClickTraceStore('worker', ${JSON.stringify(diagnosticVersion)}, self.location.origin, caches);\n})();` });
        const observation = readFileSync(path.resolve(__dirname, 'src/app/notifications/qaPushObservationWorker.js'), 'utf8').replace(/^export /gm, '');
        this.emitFile({ type: 'asset', fileName: 'qa-push-observation.js', source:
          `(() => {\n${observation}\nself.zipcoQaPushObservation = createQaPushObservationWorker({ workerBuild: ${JSON.stringify(diagnosticVersion)}, workerRevision: 'notification-click-attempt-v11', fetch: (...args) => self.fetch(...args), crypto: self.crypto });\n})();` });
      },
    }] : []),
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        importScripts: [...(clickTrace ? ['qa-notification-click-trace.js', 'qa-push-observation.js'] : []), 'push-sw.js'],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  };
})
