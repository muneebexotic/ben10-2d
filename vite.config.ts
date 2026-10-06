import { defineConfig } from 'vitest/config';

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
/** Which build a report came from (the autobench prints it): Vercel's commit, or "local". */
const BUILD = (env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || 'local';

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(BUILD) },
  build: {
    outDir: 'dist',
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          return id.includes('node_modules/phaser') ? 'phaser' : undefined;
        },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
