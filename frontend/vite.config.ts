/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true,
    port: 5173,
    // Los cambios en un bind mount de Windows no llegan como eventos al contenedor.
    watch: { usePolling: true },
    proxy: { '/api': 'http://backend:5000' },
  },
  test: {
    // Simula un navegador para poder renderizar componentes en los tests.
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // En este PC los workers tardan en arrancar y, si parten varios a la vez, Vitest
    // se rinde esperando. Con threads y uno a la vez es más lento pero confiable.
    pool: 'threads',
    maxWorkers: 1,
  },
})
