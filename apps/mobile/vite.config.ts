import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
      manifest: {
        name: 'BrAve Forms - Construction Compliance',
        short_name: 'BrAve Forms',
        description: 'EPA and OSHA compliance management for construction sites',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        categories: ['business', 'productivity'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          vendor: ['react', 'react-dom'],
          
          // UI Framework (heavy components)
          mantine: [
            '@mantine/core', 
            '@mantine/hooks', 
            '@mantine/notifications',
            '@mantine/dropzone',
            '@mantine/form',
            '@mantine/dates'
          ],
          
          // Mobile-specific Capacitor plugins
          capacitor: [
            '@capacitor/core', 
            '@capacitor/camera', 
            '@capacitor/geolocation',
            '@capacitor/filesystem',
            '@capacitor/network',
            '@capacitor/preferences'
          ],
          
          // State management and queries
          state: ['valtio', '@tanstack/react-query', '@tanstack/react-query-persist-client'],
          
          // GraphQL and networking
          graphql: ['graphql', 'graphql-request'],
          
          // Form handling
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Icons (can be large)
          icons: ['@tabler/icons-react'],
          
          // Utilities and date handling
          utils: ['dayjs', 'idb'],
        },
      },
    },
    
    // Optimize for construction site devices (limited storage)
    chunkSizeWarningLimit: 200, // 200kb warning
    
    // Additional optimizations
    reportCompressedSize: true,
    assetsInlineLimit: 4096, // Inline small assets
    
    // Terser options for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        passes: 2 // Multiple passes for better compression
      },
      mangle: {
        safari10: true // Safari compatibility
      }
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
  },
});