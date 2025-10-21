import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.BASE_URL ?? '/';

  return {
    base,
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(process.cwd(), 'index.html'),
      },
    },
    server: {
      port: Number(env.VITE_DEV_PORT ?? 5173),
      host: true,
    },
    preview: {
      port: Number(env.VITE_PREVIEW_PORT ?? 4173),
    },
  };
});
