import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8309,
    strictPort: true,
    overlay: {
      warnings: true,
      errors: (err) => {
        // 忽略 ResizeObserver 循环错误
        if (err.message && err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
          return false;
        }
        return true;
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    fallback: {
      stream: require.resolve('stream-browserify')
    }
  }
})