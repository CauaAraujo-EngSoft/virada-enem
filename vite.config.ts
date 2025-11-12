// vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // ✅ A LINHA 'base' FOI REMOVIDA
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      
      // 🚨 O BLOCO 'define' FOI REMOVIDO
      // (Isso impedia sua chave de ser exposta)

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});