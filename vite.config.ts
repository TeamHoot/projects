import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { BASE_PATH } from './site.config'

export default defineConfig({
  // 배포 경로는 site.config.ts 가 단일 원본이다.
  base: BASE_PATH,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 프리렌더 산출물을 눈으로 검증할 수 있게 소스맵을 남긴다.
    sourcemap: true,
  },
})
