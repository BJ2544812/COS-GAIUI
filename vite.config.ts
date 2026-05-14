import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  /** Proxy target for /api, /uploads, /health — use 127.0.0.1 to avoid occasional Windows `localhost` resolution issues. */
  const apiProxyTarget = (env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:4002').replace(/\/$/, '');
  /** Playwright (and other automation) sets CI=1; disable HMR to avoid fixed WS port clashes with another Vite dev server. */
  const disableHmr =
    process.env.CI === '1' || process.env.CI === 'true' || process.env.DISABLE_HMR === 'true';
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3001,
      /**
       * Allow fallback if 3001 is taken during local dev. CI passes `--strictPort` on the CLI
       * (see playwright.config.ts) so automated runs still fail loudly on port conflict.
       */
      strictPort: false,
      /**
       * When HMR is off (Playwright / parallel Vite), also disable Vite's dev WebSocket server.
       * Otherwise Vite may fall back to a dedicated listener on the default HMR port (24678) and
       * collide with another dev instance: "WebSocket server error: Port 24678 is already in use".
       * Bind to IPv4 loopback so Playwright's `http://127.0.0.1:<port>` readiness checks match
       * Windows behavior where `localhost` may not accept IPv4 connections.
       */
      ...(disableHmr
        ? {hmr: false as const, ws: false as const, host: '127.0.0.1' as const}
        : {}),
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          ws: true,
        },
        '/uploads': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        /** Backend exposes GET /health at root (not under /api/v1). */
        '/health': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
