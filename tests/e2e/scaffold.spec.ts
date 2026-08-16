import { test, expect } from '@playwright/test'
import { ROUTER_BASENAME } from '../../site.config'

/**
 * 파이프라인 + 히어로 검증.
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
    // 성단은 JS 로 배치하지만 카피는 서버에서 이미 그려져 있어야 한다.
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('./')
    await expect(page.locator('h1')).toContainText('개발팀')
    await context.close()
  })

  test('Pretendard 가 적용된다', async ({ page }) => {
    await page.goto('./')
    const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
    expect(family).toContain('Pretendard')
  })

  test('라우터 basename 이 base 와 맞다 — 로고 링크가 사이트 안을 가리킨다', async ({
    page,
  }) => {
    // basename 이 어긋나면 로고가 서버 루트(/)로 나가버린다. 배포 후에야 드러나는 사고라
    // 여기서 잡는다.
    await page.goto('./')
    const href = await page.getByRole('link', { name: 'TeamHoot' }).getAttribute('href')
    expect(href).toBe(ROUTER_BASENAME)
  })
})

test.describe('intro hero', () => {
  test('h1 이 정확히 하나이고 두 줄이 굵기로 갈린다', async ({ page }) => {
    await page.goto('./')
    await expect(page.locator('h1')).toHaveCount(1)

    const lines = page.locator('h1 span')
    await expect(lines).toHaveCount(2)
    await expect(lines.nth(0)).toHaveText('웹 · 앱 · 업무 시스템')
    await expect(lines.nth(1)).toHaveText('실력 위에 AI를 더한 개발팀입니다')

    // 위계는 크기가 아니라 굵기다 — 두 줄의 font-size 는 같고 weight 만 다르다.
    const sizes = await lines.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).fontSize),
    )
    expect(sizes[0]).toBe(sizes[1])
    await expect(lines.nth(0)).toHaveCSS('font-weight', '300')
    await expect(lines.nth(1)).toHaveCSS('font-weight', '800')
  })

  test('주장 줄이 그라디언트로 칠해진다 — 글자색은 투명이어야 한다', async ({ page }) => {
    // background-clip:text 가 빠지면 글자가 통째로 안 보인다. 회귀로 잡는다.
    await page.goto('./')
    const main = page.locator('h1 span').nth(1)
    await expect(main).toHaveCSS('color', 'rgba(0, 0, 0, 0)')
    const clip = await main.evaluate(
      (el) =>
        getComputedStyle(el).backgroundClip ||
        getComputedStyle(el).webkitBackgroundClip,
    )
    expect(clip).toBe('text')
  })

  test('프로젝트가 성단 5개로 그룹핑되고 각각 이름이 붙는다', async ({ page }) => {
    await page.goto('./')
    const clusters = page.locator('#intro button')
    await expect(clusters).toHaveCount(5)
    for (const name of ['콜택스', 'Route', '행복한 논술', '쇼핑이지', '세모배']) {
      await expect(page.locator('#intro').getByText(name, { exact: true })).toBeVisible()
    }
  })

  test('성단 이미지가 실제로 로드된다', async ({ page }) => {
    await page.goto('./')
    const img = page.locator('#intro img').first()
    await expect(img).toBeAttached()
    await expect
      .poll(() =>
        img.evaluate((el) => {
          const i = el as HTMLImageElement
          return i.complete && i.naturalWidth > 0
        }),
      )
      .toBe(true)
  })

  test('히어로에 상담 전환 CTA 가 없다 — 전환은 헤더와 상담 위젯이 담당한다', async ({
    page,
  }) => {
    // 성단 버튼은 프로젝트를 여는 것이라 전환 CTA 가 아니다.
    // 검사 대상은 상담/문의로 빠져나가는 링크다.
    await page.goto('./')
    await expect(page.locator('#intro a[href*="contact"]')).toHaveCount(0)
  })

  test('장식 레이어가 보조기술에 노출되지 않는다', async ({ page }) => {
    await page.goto('./')
    await expect(page.locator('#intro canvas')).toHaveAttribute('aria-hidden', 'true')
    // 패널 이미지는 장식이므로 alt 가 비어 있어야 한다. 이름은 버튼 라벨이 전달한다.
    await expect(page.locator('#intro img').first()).toHaveAttribute('alt', '')
    await expect(page.locator('#intro button').first()).toHaveAttribute('aria-label', /—/)
  })
})

test.describe('성단 워프', () => {
  test('성단을 누르면 그 프로젝트 상세가 열린다', async ({ page }) => {
    await page.goto('./')
    await page.locator('#intro button').filter({ hasText: '콜택스' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: '콜택스' })).toBeVisible()
    // 담당 범위가 부풀려지지 않고 그대로 나와야 한다
    await expect(dialog).toContainText('전체 개발 주기를 리드')
  })

  test('Esc 로 닫히고 헤드라인이 돌아온다', async ({ page }) => {
    await page.goto('./')
    await page.locator('#intro button').filter({ hasText: 'Route' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('브라우저 뒤로가기로 닫힌다 — 사이트를 떠나지 않는다', async ({ page }) => {
    await page.goto('./')
    await page.locator('#intro button').filter({ hasText: '세모배' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.goBack()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // 여전히 랜딩에 있어야 한다
    await expect(page.locator('h1')).toBeVisible()
  })

  test('위로 스크롤하면 닫힌다 (데스크톱)', async ({ page, isMobile }) => {
    // 모바일 WebKit 은 mouse.wheel 을 지원하지 않는다. 터치 경로는 아래 테스트가 본다.
    test.skip(!!isMobile, '모바일은 휠 대신 스와이프를 쓴다')
    await page.goto('./')
    await page.locator('#intro button').filter({ hasText: '쇼핑이지' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.mouse.move(400, 400)
    await page.mouse.wheel(0, -200)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('닫기 버튼으로 닫힌다', async ({ page }) => {
    // 아래로 스와이프해 닫는 경로도 있지만, WebKit 에서 touchmove 를 신뢰성 있게
    // 합성할 수 없어 E2E 로는 덮지 못한다. 버튼·Esc·뒤로가기·휠 네 경로로 대신 검증한다.
    await page.goto('./')
    await page.locator('#intro button').filter({ hasText: '쇼핑이지' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('상세가 열리면 닫기 버튼으로 포커스가 간다', async ({ page }) => {
    await page.goto('./')
    await page.locator('#intro button').filter({ hasText: '행복한 논술' }).click()
    const close = page.getByRole('button', { name: '닫기' })
    await expect(close).toBeFocused()
  })
})
