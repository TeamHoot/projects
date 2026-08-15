import { test, expect } from '@playwright/test'

/**
 * Phase 0 스캐폴드 검증.
 *
 * 화면 내용이 아니라 '파이프라인이 성립하는가'만 본다.
 * 각 UNIT의 수용 기준(Acceptance Criteria) 테스트는 해당 화면의 E2E 단계에서
 * docs/plans/P<NNN>-*.md 를 근거로 따로 작성한다 (CLAUDE.md §5).
 */
test.describe('scaffold', () => {
  test('/ 가 HTTP 200 으로 응답한다 (404 폴백이 아님)', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })

  test('JS 없이도 본문이 보인다 — 빌드타임 프리렌더 확인', async ({ browser }) => {
    // 프리렌더의 핵심은 JS가 꺼져도 HTML에 내용이 들어있다는 것이다.
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await context.close()
  })

  test('Pretendard 가 적용된다', async ({ page }) => {
    await page.goto('/')
    const family = await page.evaluate(
      () => getComputedStyle(document.body).fontFamily,
    )
    expect(family).toContain('Pretendard')
  })
})
