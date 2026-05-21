import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react({ jsxRuntime: 'automatic', jsxImportSource: 'react' }), tailwindcss()],
    define: {
      // SECURITY: Do NOT expose API keys to the frontend bundle
      // GEMINI_API_KEY should only exist on the backend server
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || ''),
      'process.env.VITE_PAYSTACK_PUBLIC_KEY': JSON.stringify(process.env.VITE_PAYSTACK_PUBLIC_KEY || env.VITE_PAYSTACK_PUBLIC_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    }
  };
});
