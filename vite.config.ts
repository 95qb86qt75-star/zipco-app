import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execFileSync } from 'node:child_process'
import { qaLoadDiagnosticsEnabled } from './scripts/qa-load-diagnostics-config.mjs'


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
  },
  plugins: [
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
        importScripts: ['push-sw.js'],
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
