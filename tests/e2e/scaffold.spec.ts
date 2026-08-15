import { test, expect } from '@playwright/test'
import { ROUTER_BASENAME } from '../../site.config'

/**
 * 파이프라인 검증 — 화면 내용이 아니라 '구조가 성립하는가'를 본다.
 * P005 의 수용 기준(AC-*) 테스트는 명세가 PLAN_REVIEW 를 통과한 뒤 따로 작성한다.
 *
 * 경로는 반드시 상대(`./`)로 쓴다. baseURL 이 하위 경로(/projects/)라
 * `goto('/')` 는 base 를 버리고 서버 루트로 가버린다.
 */
test.describe('scaffold', () => {
  test('랜딩이 HTTP 200 으로 응답한다 (404 폴백이 아님)', async ({ page }) => {
    const response = await page.goto('./')
    expect(response?.status()).toBe(200)
  })

  test('JS 없이도 히어로 카피가 보인다 — 빌드타임 프리렌더 확인', async ({ browser }) => {
    // 프리렌더의 핵심은 JS가 꺼져도 HTML에 내용이 들어있다는 것이다.
    // 패널·별은 JS 로 만들지만 카피는 서버에서 이미 그려져 있어야 한다.
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('./')
    await expect(page.locator('h1')).toContainText('개발팀')
    await context.close()
  })

  test('Pretendard 가 적용된다', async ({ page }) => {
    await page.goto('./')
    const family = await page.evaluate(
      () => getComputedStyle(document.body).fontFamily,
    )
    expect(family).toContain('Pretendard')
  })

  test('라우터 basename 이 base 와 맞다 — 로고 링크가 사이트 안을 가리킨다', async ({
    page,
  }) => {
    // basename 이 어긋나면 로고가 서버 루트(/)로 나가버린다. 배포 후에야 드러나는 사고라
    // 여기서 잡는다.
    await page.goto('./')
    // react-router 는 basename + to="/" 를 끝 슬래시 없이 렌더한다 → "/projects"
    const href = await page.getByRole('link', { name: 'TeamHoot' }).getAttribute('href')
    expect(href).toBe(ROUTER_BASENAME)
  })
})

test.describe('intro hero', () => {
  test('h1 이 정확히 하나이고 강조어가 순백으로 분리돼 있다', async ({ page }) => {
    await page.goto('./')
    await expect(page.locator('h1')).toHaveCount(1)
    const em = page.locator('h1 span')
    await expect(em).toHaveText('개발팀')
    // 강조는 색이 아니라 밝기 차이로 준다 — 강조어만 순백이어야 한다.
    await expect(em).toHaveCSS('color', 'rgb(255, 255, 255)')
  })

  test('3D 패널이 실제 프로젝트 화면으로 채워진다', async ({ page }) => {
    await page.goto('./')
    const panels = page.locator('#intro img')
    // 데스크톱 16 / 모바일 10
    await expect(panels.first()).toBeAttached()
    const count = await panels.count()
    expect(count).toBeGreaterThanOrEqual(10)

    // 이미지가 404 가 아니라 실제로 그려졌는지 확인한다.
    const loaded = await panels.first().evaluate((el) => {
      const img = el as HTMLImageElement
      return img.complete && img.naturalWidth > 0
    })
    expect(loaded).toBe(true)
  })

  test('히어로에 전환 CTA 가 없다 — 전환은 헤더와 상담 위젯이 담당한다', async ({
    page,
  }) => {
    // 스크롤 안내(#앵커)는 전환 CTA 가 아니므로 허용한다. 2차에서 붙어도 이 테스트는 살아남는다.
    await page.goto('./')
    const converting = page.locator('#intro a[href]:not([href^="#"]), #intro button')
    await expect(converting).toHaveCount(0)
  })

  test('장식 레이어가 보조기술에 노출되지 않는다', async ({ page }) => {
    await page.goto('./')
    for (const sel of ['#intro canvas', '#intro > div[aria-hidden]']) {
      await expect(page.locator(sel).first()).toHaveAttribute('aria-hidden', 'true')
    }
    // 패널 이미지는 장식이므로 alt 가 비어 있어야 한다.
    await expect(page.locator('#intro img').first()).toHaveAttribute('alt', '')
  })
})
