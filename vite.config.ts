import { fileURLToPath, URL } from 'node:url'
import { join } from 'path'
import { writeFileSync } from 'fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
const baseurl = 'http://10.30.26.4:7209'
// https://vitejs.dev/config/
export default defineConfig({
  base: `${
    process.env.NODE_ENV === 'production' ? 'http://localhost:9527' : ''
  }/tesla-full-view/`,
  plugins: [
    vue(),
    vueJsx()
  ],
  define: {
    'process.env': {}
  },
  server: {
    host: 'localhost',
    port: 5021,
    proxy: {
      '/api': {
        target: baseurl,
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#': fileURLToPath(new URL('../../../src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/scss/index.scss" ;`,
        javascriptEnabled: true
      }
    }
  }
})
