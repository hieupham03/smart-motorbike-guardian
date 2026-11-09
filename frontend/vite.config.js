import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';

const certFile = process.env.GUARDIAN_HTTPS_CERT_FILE;
const keyFile = process.env.GUARDIAN_HTTPS_KEY_FILE;
if (Boolean(certFile) !== Boolean(keyFile)) throw new Error('HTTPS requires both a certificate and a private key');
const https = certFile ? { cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) } : undefined;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: process.env.BACKEND_URL || 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  preview: { https }
});
