import { defineConfig, devices } from '@playwright/test'
import { BASE_PATH } from './site.config'

const PORT = 4173
// vite preview 는 base 를 존중한다 — 사이트는 루트가 아니라 BASE_PATH 아래에 뜬다.
const BASE_URL = `http://localhost:${PORT}${BASE_PATH}`

// E2E 는 dev 서버가 아니라 '빌드 산출물 프리뷰'를 때린다.
// 프리렌더된 실제 HTML을 검증해야 하기 때문이다 (CLAUDE.md §1).
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // 브레이크포인트 주력은 680(모바일 전환) / 820(태블릿) — DESIGN_SYSTEM §3
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    command: 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
})
