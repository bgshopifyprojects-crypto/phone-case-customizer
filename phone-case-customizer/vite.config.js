import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'no-html-output',
      generateBundle(options, bundle) {
        // Remove any HTML files from the bundle
        for (const fileName in bundle) {
          if (fileName.endsWith('.html')) {
            delete bundle[fileName];
          }
        }
      }
    }
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  build: {
    outDir: '../extensions/phone-case-customizer/assets',
    emptyOutDir: false,
    cssCodeSplit: false,
    sourcemap: false,
    copyPublicDir: true,
    lib: {
      entry: './src/main.jsx',
      formats: ['iife'],
      name: 'PhoneCustomizer',
      fileName: () => 'phone-case-customizer.js'
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'phone-case-customizer.css'
          }
          return '[name].[ext]'
        },
      },
    },
  },
})
