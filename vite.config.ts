/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tools that pick a free port pass it in PORT; otherwise use Vite's default (5173, or the next free one).
const envPort = Number((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.PORT);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: envPort ? { port: envPort, strictPort: true } : { port: 5173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
