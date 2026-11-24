import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Tests need an absolute API URL; the dev .env may use the relative
    // /local-api proxy path, which `new URL()` cannot parse.
    env: { VITE_API_URL: 'http://localhost:3000' },
    include: ['src/**/*.test.ts']
  }
});
