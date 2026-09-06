import { defineConfig } from 'vite';
import { readFileSync } from 'fs';

// © 2026 Nicolas GUÉRET / GUERETTECH — Ma Vigne
// Code source protégé par le droit d'auteur. Toute reproduction ou
// commercialisation sans autorisation écrite est interdite.

export default defineConfig({
  root: '.',
  publicDir: 'public',

  build: {
    // Minification Terser : obfuscation du code source produit
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        passes: 2,
        unsafe: true,
      },
      mangle: {
        toplevel: true,
        reserved: ['firebase','db','auth'],
      },
      format: {
        comments: false,  // Supprime tous les commentaires dans le build
        // Entête de copyright injecté une seule fois
        preamble: '/* (c) 2026 GUERETTECH - Ma Vigne - Tous droits réservés */',
      },
    },

    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      input: { main: './index.html' },
    },

    chunkSizeWarningLimit: 800,
  },

  server: {
    port: 5173,
    open: true,
    host: true,
  },
});
