import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// base 는 배포 URL 형태가 결정한다 (CLAUDE.md §4).
//   TeamHoot/TeamHoot.github.io → https://teamhoot.github.io      → "/"
//   TeamHoot/projects          → https://teamhoot.github.io/projects → "/projects/"
// 사람 지시(2026-08-15): 루트 주소로 서비스한다 → "/".
export default defineConfig({
  base: '/',
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
