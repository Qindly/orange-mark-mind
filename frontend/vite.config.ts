import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const devPort = Number(env.VITE_PORT || 60103)

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: Number.isNaN(devPort) ? 60103 : devPort,
      strictPort: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-markdown': [
              'react-markdown',
              'remark-gfm',
              'remark-math',
              'rehype-highlight',
              'rehype-katex',
              'rehype-slug',
              'highlight.js',
              'katex',
            ],
            'vendor-mermaid': ['mermaid'],
          },
        },
      },
    },
  }
})
