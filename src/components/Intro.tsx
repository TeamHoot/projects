import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PROJECTS } from '../data/projects'
import ProjectDetail from './ProjectDetail'
import styles from './Intro.module.css'

/**
 * 인트로 히어로 — 검은 우주에 프로젝트가 성단(星團)으로 떠 있다.
 *
 * 배경에 실제 작업물을 흘려 "무엇을 만드는가"를 말 없이 보여주는 구조는
 * 레퍼런스(educomproject.co.kr)에서 가져왔지만, 그 뒤는 다르게 만들었다.
 *
 *   1. 화면들이 흩어져 떠다니지 않고 **프로젝트별로 뭉쳐** 하나의 성단을 이룬다.
 *   2. 커서가 가까이 가면 그 성단만 또렷해지고 프로젝트 이름이 별처럼 빛난다.
 *   3. 누르면 그 성단으로 **워프**해 들어가 상세가 열린다.
 *   4. 스크롤을 위로 올리거나 뒤로가기를 누르면 헤드라인으로 돌아온다.
 *
 * 배치와 별 그리기는 전부 useEffect 안에서 한다. Math.random 을 렌더 중에 쓰면
 * 프리렌더 HTML 과 클라이언트 결과가 달라져 하이드레이션이 깨진다.
 */

const MOBILE_BREAKPOINT = 820
const PERSPECTIVE = 1000

/** 기울기 최대치. 더 키우면 패널이 옆면을 보여 화면이 무너진다. */
const MAX_TILT_Y = 13
const MAX_TILT_X = 9
/** 커서를 따라가는 속도. 1 이면 즉각, 낮을수록 묵직하다. */
const EASING = 0.075
/** 성단 클릭·감지 영역을 패널보다 이만큼(px) 넓게 잡는다 — '근처에 가면' 반응하도록.
 *  커서가 없는 기기에서는 근접이라는 개념이 없고, 넓게 잡으면 성단끼리 겹쳐
 *  엉뚱한 프로젝트가 눌린다. 그래서 좁은 화면에서는 거의 주지 않는다. */
const WAKE_PAD = 34
/** 고정 헤더(--header-h)가 덮는 높이. 그 아래로 성단을 밀어낸다. */
const HEADER_H = 68
const WAKE_PAD_NARROW = 12

/**
 * 좁은 화면의 성단 출발 자리 (화면 중심 기준 vw·vh 비율).
 * 폭이 좁아 카피가 가운데를 거의 다 차지하므로, 무작위 링에서 출발하면
 * 이완이 자리를 못 찾아 이름표가 글자에 얹힌다. 모서리에서 시작해 이완으로 다듬는다.
 */
const NARROW_SLOTS = [
  { x: -0.3, y: -0.34 },
  { x: 0.3, y: -0.34 },
  { x: -0.32, y: 0.34 },
  { x: 0.32, y: 0.34 },
  { x: 0.0, y: 0.45 },
] as const

/* ───── 배경 별자리 필드 (C3 시안) ───── */

/** 넓은 화면의 별 개수. 그물 판정이 O(n²)이라 늘리면 프레임이 바로 무거워진다. */
const STAR_COUNT = 78
/** 별끼리 선으로 이어지기 시작하는 거리(px) */
const LINK_DIST = 170
/** 커서가 별을 끌어당기는(선으로 잇는) 반경(px) */
const CURSOR_DIST = 265
/** 미리 이어 둘 성좌 개수와 성좌 하나의 최대 꼭짓점 수 */
const FIGURE_COUNT = 3
const FIGURE_MAX_POINTS = 5

type Star = {
  x: number
  y: number
  /** 반지름 */
  r: number
  /** 시차 계수 — 클수록 커서를 크게 따라간다(앞쪽 별) */
  depth: number
  alpha: number
  /** 반짝임 위상·속도 */
  phase: number
  speed: number
  vx: number
  vy: number
  /** 일부만 푸른 별로 — 전부 흰색이면 화면이 죽는다 */
  blue: boolean
}

/** 화면 밖으로 나간 별을 반대편으로 되돌린다. */
function wrap(v: number, max: number) {
  if (v < 0) return max
  if (v > max) return 0
  return v
}

/**
 * 가장 가까운 이웃을 따라가며 성좌 경로를 만든다.
 * 매 프레임 최근접 탐색을 하면 별이 흐르는 동안 선이 튀므로 한 번만 굳혀 둔다.
 */
function buildFigures(stars: Star[]): number[][] {
  const figures: number[][] = []
  for (let f = 0; f < FIGURE_COUNT; f++) {
    const path = [Math.floor(Math.random() * stars.length)]
    const points = 4 + Math.floor(Math.random() * (FIGURE_MAX_POINTS - 3))
    while (path.length < points) {
      const last = stars[path[path.length - 1] ?? 0]
      if (!last) break
      let best = -1
      let bestDist = Infinity
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        if (!s || path.includes(i)) continue
        const d = (s.x - last.x) ** 2 + (s.y - last.y) ** 2
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      }
      if (best < 0) break
      path.push(best)
    }
    figures.push(path)
  }
  return figures
}


type Placed = {
  slug: string
  /** 성단 중심 (원근 보정 전 화면 좌표) */
  cx: number
  cy: number
  cz: number
  /** 성단이 차지하는 실제 크기 — 클릭·호버 영역이 된다 */
  cw: number
  ch: number
  /** 클릭·감지 영역 여유 */
  pad: number
  panels: {
    src: string
    w: number
    h: number
    dx: number
    dy: number
    dz: number
    rx: number
    ry: number
  }[]
}

type IntroProps = {
  /** 스크롤 안내가 가리킬 다음 섹션 id. 없으면 안내를 렌더하지 않는다. */
  nextSectionId?: string
}

export default function Intro({ nextSectionId }: IntroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const hitsRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [placed, setPlaced] = useState<Placed[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [warped, setWarped] = useState<string | null>(null)

  const warpedProject = useMemo(
    () => PROJECTS.find((p) => p.slug === warped) ?? null,
    [warped],
  )

  // ── 성단 배치 ──
  useEffect(() => {
    const narrow = window.innerWidth < MOBILE_BREAKPOINT
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const vw = window.innerWidth
    const vh = window.innerHeight

    // 방문할 때마다 성단이 다른 자리에 오도록 링의 시작 각도를 돌린다.
    const spin = Math.random() * Math.PI * 2

    // 1차 — 무작위 링 배치. 화면상 좌표(cx, cy)와 크기를 먼저 구한다.
    const draft = PROJECTS.map((p, i) => {
      const ang = (i / PROJECTS.length) * Math.PI * 2 + spin + rand(-0.18, 0.18)
      const depth = rand(300, 820)
      const rx = rand(vw * 0.3, vw * 0.46)
      const ry = rand(vh * 0.28, vh * 0.42)

      // 좁은 화면에서는 성단 하나가 화면 폭의 절반을 넘어 서로 겹친다. 대표 한 장만 띄운다.
      const imgs = narrow ? p.images.slice(0, 1) : p.images
      const wideW = narrow ? 158 : 258
      const tallW = narrow ? 72 : 104

      const panels = imgs.map((img, k) => {
        const w = img.tall ? tallW : wideW
        const h = img.tall ? Math.round(w * 2.16) : Math.round(w * 0.625)
        // 성단 안에서 살짝 어긋나게 겹쳐 둔다 — 카드 뭉치처럼 보이게
        const fan = k - (imgs.length - 1) / 2
        return {
          src: img.src,
          w,
          h,
          dx: Math.round(fan * (img.tall ? w * 0.78 : w * 0.42) + rand(-10, 10)),
          dy: Math.round(rand(-26, 26) + Math.abs(fan) * 18),
          dz: Math.round(rand(-70, 70)),
          rx: Number(rand(-5, 5).toFixed(1)),
          ry: Number(rand(-11, 11).toFixed(1)),
        }
      })

      // 실제 시각 범위로 잰다. |dx|*2+w 식은 한쪽으로 치우친 배치를 두 배로 세어 과대평가한다.
      const cw =
        Math.max(...panels.map((q) => q.dx + q.w / 2)) -
        Math.min(...panels.map((q) => q.dx - q.w / 2))
      const ch =
        Math.max(...panels.map((q) => q.dy + q.h / 2)) -
        Math.min(...panels.map((q) => q.dy - q.h / 2))
      const pad = narrow ? WAKE_PAD_NARROW : WAKE_PAD
      // 원근으로 줄어든 화면상 반폭·반높이. 겹침 판정은 이 값으로 한다.
      const s = PERSPECTIVE / (PERSPECTIVE + depth)
      const slot = NARROW_SLOTS[i % NARROW_SLOTS.length]
      return {
        slug: p.slug,
        x: narrow && slot ? slot.x * vw : Math.cos(ang) * rx,
        y: narrow && slot ? slot.y * vh : Math.sin(ang) * ry,
        depth,
        cw,
        ch,
        pad,
        hw: (cw * s) / 2 + pad,
        hh: (ch * s) / 2 + pad,
        panels,
      }
    })

    // 2차 — 겹침 이완.
    // 무작위 배치는 매번 다른 화면을 주지만, 성단이 겹치면 위에 얹힌 다른 프로젝트가
    // 눌려버린다(엉뚱한 상세가 열린다). 무작위성은 두고 겹친 쌍만 밀어낸다.
    // 카피 영역도 움직이지 않는 장애물로 취급해 글자 위에 성단이 오지 않게 한다.
    // 카피 영역은 추정하지 않고 실제 렌더된 글자 상자를 잰다.
    // 고정값으로 잡았더니 헤드라인이 그보다 넓어 라벨이 글자 위에 얹혔다(100번 중 57번).
    // 카피는 프리렌더돼 있으므로 이 시점에 이미 측정 가능하다.
    let copyHalfW = Math.min(vw * 0.46, 470)
    let copyHalfH = narrow ? vh * 0.28 : 190
    const copyEl = copyRef.current
    if (copyEl) {
      const range = document.createRange()
      range.selectNodeContents(copyEl)
      const rects = Array.from(range.getClientRects())
      if (rects.length > 0) {
        const left = Math.min(...rects.map((r) => r.left))
        const right = Math.max(...rects.map((r) => r.right))
        const top = Math.min(...rects.map((r) => r.top))
        const bottom = Math.max(...rects.map((r) => r.bottom))
        // 성단 좌표는 화면 중심 기준이다. 글자 상자도 같은 기준으로 옮긴다.
        copyHalfW = Math.max(Math.abs(left - vw / 2), Math.abs(right - vw / 2)) + 28
        // 여유를 더 키우면 성단이 가장자리로 밀렸다가 화면 벽에 걸려 오히려 뭉친다.
        // 실측상 24px 가 가장 나았다.
        copyHalfH = Math.max(Math.abs(top - vh / 2), Math.abs(bottom - vh / 2)) + 24
      }
    }

    for (let iter = 0; iter < 200; iter++) {
      let moved = false

      for (const a of draft) {
        // 카피 영역 밀어내기
        const ox = a.hw + copyHalfW - Math.abs(a.x)
        const oy = a.hh + copyHalfH - Math.abs(a.y)
        if (ox > 0 && oy > 0) {
          // 덜 밀어도 되는 축으로 뺀다
          if (ox < oy) a.x += (a.x < 0 ? -1 : 1) * ox
          else a.y += (a.y < 0 ? -1 : 1) * oy
          moved = true
        }
      }

      for (let i = 0; i < draft.length; i++) {
        for (let j = i + 1; j < draft.length; j++) {
          const a = draft[i]
          const b = draft[j]
          if (!a || !b) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const ox = a.hw + b.hw - Math.abs(dx)
          const oy = a.hh + b.hh - Math.abs(dy)
          if (ox <= 0 || oy <= 0) continue
          const sx = dx < 0 ? -1 : 1
          const sy = dy < 0 ? -1 : 1
          if (ox < oy) {
            a.x -= (sx * ox) / 2
            b.x += (sx * ox) / 2
          } else {
            a.y -= (sy * oy) / 2
            b.y += (sy * oy) / 2
          }
          moved = true
        }
      }

      // 벽(화면 경계)은 루프 '안에서' 적용해야 한다. 이완이 끝난 뒤에 밀어 넣으면
      // 방금 푼 겹침이 되살아난다 — 실제로 20~30% 확률로 엉뚱한 성단이 눌렸다.
      for (const a of draft) {
        const limitX = Math.max(0, vw / 2 - a.hw)
        // 위쪽은 고정 헤더가 덮으므로 그만큼 덜 올라간다 — 안 그러면 헤더 바에 가려 안 눌린다.
        const limitTop = Math.max(0, vh / 2 - a.hh - HEADER_H)
        const limitBottom = Math.max(0, vh / 2 - a.hh)
        const nx = Math.max(-limitX, Math.min(limitX, a.x))
        const ny = Math.max(-limitTop, Math.min(limitBottom, a.y))
        if (nx !== a.x || ny !== a.y) {
          a.x = nx
          a.y = ny
          moved = true
        }
      }

      if (!moved) break
    }

    // 3차 — 3D 좌표로 되돌린다.
    // spread 를 곱해 z 로 밀어 넣어도 투영하면 화면상 중심은 다시 (x, y) 다.
    const next: Placed[] = draft.map((c) => {
      const x = c.x
      const y = c.y
      const spread = (PERSPECTIVE + c.depth) / PERSPECTIVE
      return {
        slug: c.slug,
        cx: x * spread,
        cy: y * spread,
        cz: -c.depth,
        cw: c.cw,
        ch: c.ch,
        pad: c.pad,
        panels: c.panels,
      }
    })

    setPlaced(next)
  }, [])

  // ── 기울기 + 근접 감지 ──
  useEffect(() => {
    const tilt = tiltRef.current
    const section = sectionRef.current
    if (!tilt || !section || placed.length === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0
    let raf = 0
    let live = true
    const start = performance.now()
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect()
      targetX = (e.clientX - r.left) / r.width - 0.5
      targetY = (e.clientY - r.top) / r.height - 0.5
    }
    const onLeave = () => {
      targetX = 0
      targetY = 0
    }

    const tick = (now: number) => {
      if (!live) return
      if (!hasPointer) {
        // 커서가 없는 기기 — 아주 느린 8자 흔들림만
        const t = (now - start) / 1000
        targetX = Math.sin(t * 0.16) * 0.32
        targetY = Math.sin(t * 0.11) * 0.22
      }
      curX += (targetX - curX) * EASING
      curY += (targetY - curY) * EASING
      tilt.style.transform =
        `rotateY(${(curX * MAX_TILT_Y).toFixed(2)}deg) ` +
        `rotateX(${(-curY * MAX_TILT_X).toFixed(2)}deg) ` +
        `translate3d(${(-curX * 26).toFixed(1)}px, ${(-curY * 18).toFixed(1)}px, 0)`
      // 라벨 레이어는 평면이라 회전은 빼고 이동만 따라간다 — 글자가 안 뭉개진다
      if (hitsRef.current) {
        hitsRef.current.style.transform =
          `translate3d(${(-curX * 26).toFixed(1)}px, ${(-curY * 18).toFixed(1)}px, 0)`
      }
      raf = requestAnimationFrame(tick)
    }

    if (hasPointer) {
      section.addEventListener('pointermove', onMove)
      section.addEventListener('pointerleave', onLeave)
    }
    raf = requestAnimationFrame(tick)

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (!live) {
              live = true
              raf = requestAnimationFrame(tick)
            }
          } else {
            live = false
            cancelAnimationFrame(raf)
          }
        }),
      { threshold: 0 },
    )
    io.observe(section)

    return () => {
      live = false
      cancelAnimationFrame(raf)
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      io.disconnect()
    }
  }, [placed])

  // ── 워프 열기/닫기 ──
  const openProject = useCallback((slug: string) => {
    setWarped(slug)
    // URL 은 바꾸지 않는다. 이 오버레이는 히어로의 일부일 뿐이고,
    // 공유 가능한 정식 상세는 `/works/:slug`(P004)로 따로 만든다.
    // 그래도 뒤로가기로 닫히게 하려면 히스토리 항목은 필요하다.
    window.history.pushState({ warp: slug }, '')
  }, [])

  const closeProject = useCallback((fromPopstate: boolean) => {
    setWarped(null)
    // 뒤로가기로 닫힌 게 아니라면 우리가 쌓은 항목을 직접 걷어낸다.
    if (!fromPopstate && window.history.state?.warp) window.history.back()
  }, [])

  useEffect(() => {
    if (!warped) return

    const onPop = () => closeProject(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProject(false)
    }
    // 스크롤을 위로 올리면 헤드라인으로 돌아온다.
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < -12) closeProject(false)
    }
    let touchStart = 0
    const onTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0
      if (y - touchStart > 60) closeProject(false)
    }

    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [warped, closeProject])

  // ── 별자리 필드 ──
  // C3 시안의 배경. 예전에는 중심에서 뻗어 나오는 워프 필드였는데,
  // 성단(프로젝트 패널)도 같은 중심에서 원근으로 퍼져 있어 두 원근이 싸웠다.
  // 지금은 정적인 별 사이를 선으로 잇는 성좌 그물이라 성단과 층이 겹치지 않는다.
  useEffect(() => {
    const canvas = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let stars: Star[] = []
    /** 미리 이어 둔 성좌 — 매 프레임 이웃을 다시 찾지 않도록 별 인덱스 경로로 굳혀 둔다. */
    let figures: number[][] = []
    let raf = 0
    let live = true
    let t = 0
    // 커서 위치와, 그 커서를 따라 그물 전체가 느리게 흘러가는 시차(parallax) 오프셋
    let mx = -1e4
    let my = -1e4
    let targetX = 0
    let targetY = 0
    let offX = 0
    let offY = 0

    const build = () => {
      w = section.clientWidth
      h = section.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // 좁은 화면은 별 하나가 차지하는 각이 커서 같은 수를 뿌리면 지저분하다.
      const n = w < MOBILE_BREAKPOINT ? 44 : STAR_COUNT
      stars = Array.from({ length: n }, () => {
        const depth = Math.random()
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + depth * 1.5,
          depth: 0.3 + depth * 0.7,
          alpha: 0.18 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          speed: 0.15 + Math.random() * 0.35,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          blue: Math.random() < 0.18,
        }
      })
      figures = buildFigures(stars)
    }

    const draw = () => {
      if (!live) return
      t += 0.016
      ctx.clearRect(0, 0, w, h)
      offX += (targetX - offX) * 0.06
      offY += (targetY - offY) * 0.06

      // 별을 흘리고, 시차를 얹은 '그려질 좌표'를 먼저 다 구한다.
      const pts = stars.map((st) => {
        st.x = wrap(st.x + st.vx, w)
        st.y = wrap(st.y + st.vy, h)
        return {
          x: st.x + offX * st.depth,
          y: st.y + offY * st.depth,
          r: st.r,
          star: st,
          twinkle: 0.65 + 0.35 * Math.sin(t * st.speed + st.phase),
        }
      })

      // 가까운 별끼리 잇는 그물
      ctx.lineWidth = 1
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i]
          const b = pts[j]
          if (!a || !b) continue
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d >= LINK_DIST) continue
          ctx.strokeStyle = `rgba(255,255,255,${0.115 * (1 - d / LINK_DIST)})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      // 굳혀 둔 성좌 — 그물보다 조금 더 밝고 푸르게 그어 형태가 읽히게 한다
      ctx.strokeStyle = 'rgba(190,208,255,.19)'
      for (const path of figures) {
        ctx.beginPath()
        path.forEach((idx, n) => {
          const p = pts[idx]
          if (!p) return
          if (n === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()
      }

      // 커서 주변의 별은 커서와 이어지며 함께 밝아진다 — 이 반응이 C3 의 핵심이다
      if (mx > -9000) {
        for (const p of pts) {
          const d = Math.hypot(p.x - mx, p.y - my)
          if (d >= CURSOR_DIST) continue
          const near = 1 - d / CURSOR_DIST
          ctx.strokeStyle = `rgba(140,175,255,${0.5 * near})`
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mx, my)
          ctx.stroke()
          p.twinkle += near * 1.1
          p.r += near * 0.7
        }
      }

      for (const p of pts) {
        const a = Math.min(1, p.star.alpha * p.twinkle)
        ctx.fillStyle = p.star.blue
          ? `rgba(160,190,255,${a})`
          : `rgba(255,255,255,${a})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect()
      mx = e.clientX - r.left
      my = e.clientY - r.top
      targetX = (mx / r.width - 0.5) * 26
      targetY = (my / r.height - 0.5) * 18
    }
    const onLeave = () => {
      mx = -1e4
      my = -1e4
      targetX = 0
      targetY = 0
    }

    build()
    draw()
    const onResize = () => build()
    window.addEventListener('resize', onResize)
    section.addEventListener('pointermove', onMove)
    section.addEventListener('pointerleave', onLeave)

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (!live) {
              live = true
              draw()
            }
          } else {
            live = false
            cancelAnimationFrame(raf)
          }
        }),
      { threshold: 0 },
    )
    io.observe(section)

    return () => {
      live = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      io.disconnect()
    }
  }, [])

  // 워프 중에는 대상 성단을 화면 중앙으로 끌어와 확대한다.
  const warpTransform = (() => {
    if (!warped) return undefined
    const c = placed.find((p) => p.slug === warped)
    if (!c) return undefined
    const s = PERSPECTIVE / (PERSPECTIVE + Math.abs(c.cz))
    return `scale(2.6) translate3d(${-c.cx * s}px, ${-c.cy * s}px, 0)`
  })()

  return (
    <section
      className={`${styles.intro} ${warped ? styles.warping : ''}`}
      ref={sectionRef}
      id="intro"
    >
      {/* 위쪽에서 내려오는 코발트 광원. 별자리 필드보다 아래에 깔아 그물이 그 위에 뜨게 한다. */}
      <div className={styles.glow} aria-hidden="true" />
      <canvas className={styles.stars} ref={canvasRef} aria-hidden="true" />

      <div className={styles.warp} style={{ transform: warpTransform }}>
        <div className={styles.space} ref={tiltRef} aria-hidden="true">
          {placed.map((c) => (
            <div
              key={c.slug}
              className={`${styles.cluster} ${active === c.slug ? styles.awake : ''} ${
                warped && warped !== c.slug ? styles.dimmed : ''
              }`}
              style={{
                ['--cx' as string]: `${Math.round(c.cx)}px`,
                ['--cy' as string]: `${Math.round(c.cy)}px`,
                ['--cz' as string]: `${c.cz}px`,
                ['--cw' as string]: `${c.cw}px`,
                ['--ch' as string]: `${c.ch}px`,
              }}
            >
              {c.panels.map((p, i) => (
                <span
                  key={i}
                  className={styles.panel}
                  style={{
                    ['--w' as string]: `${p.w}px`,
                    ['--h' as string]: `${p.h}px`,
                    ['--x' as string]: `${p.dx}px`,
                    ['--y' as string]: `${p.dy}px`,
                    ['--z' as string]: `${p.dz}px`,
                    ['--rx' as string]: `${p.rx}deg`,
                    ['--ry' as string]: `${p.ry}deg`,
                  }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}images/intro/${p.src}.jpg`}
                    alt=""
                    // 히어로는 첫 화면이다 — lazy 를 걸면 뷰포트 안인데도 늦게 뜬다
                    loading="eager"
                    decoding="async"
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 클릭·라벨은 평면 레이어로 뺐다.
          3D 안에서는 브라우저 히트 테스트가 투영된 박스와 어긋나 버튼이 눌리지 않고,
          글자도 3D 렌더링을 거치며 뭉개진다. 기울기는 이동분만 따라간다. */}
      <div className={styles.hits} ref={hitsRef}>
        {placed.map((c) => {
          const project = PROJECTS.find((p) => p.slug === c.slug)
          if (!project) return null
          // 원근으로 줄어든 화면상 위치·크기에 맞춘다.
          const s = PERSPECTIVE / (PERSPECTIVE + Math.abs(c.cz))
          return (
            <button
              key={c.slug}
              type="button"
              className={`${styles.hit} ${active === c.slug ? styles.awake : ''} ${
                warped ? styles.dimmed : ''
              }`}
              style={{
                left: `calc(50% + ${Math.round(c.cx * s)}px)`,
                top: `calc(50% + ${Math.round(c.cy * s)}px)`,
                width: `${Math.round(c.cw * s) + c.pad * 2}px`,
                height: `${Math.round(c.ch * s) + c.pad * 2}px`,
              }}
              onPointerEnter={() => setActive(c.slug)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(c.slug)}
              onBlur={() => setActive(null)}
              onClick={() => openProject(c.slug)}
              aria-label={`${project.name} — ${project.tagline}`}
            >
              {/* 별처럼 빛나는 이름 */}
              <span className={styles.label}>
                <span className={styles.labelName}>{project.name}</span>
                <span className={styles.labelTag}>{project.tagline}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.copy} ref={copyRef}>
        {/* 아이브로우는 양옆 가는 선 사이에 놓는다 — 헤드라인 위에 가로축을 하나 그어
            시선을 가운데로 모으는 C3 시안의 장치다. */}
        <p className={styles.eyebrow}>
          <span className={styles.rule} aria-hidden="true" />
          설계 26년차 리드 · 전담 QA 보유
          <span className={styles.rule} aria-hidden="true" />
        </p>
        {/* 주어는 '실력 있는 팀'이고 AI 는 그 팀이 쓰는 도구다. 순서를 뒤집으면
            AI 로 찍어내는 팀처럼 읽힌다. 각 줄은 레퍼런스와 같은 13~17자로 맞춘다. */}
        {/* 두 줄은 '무엇을' → '누가'의 위계다. 예전에는 크기 차이로 줬는데,
            C3 는 같은 크기를 유지한 채 **굵기와 밝기**로만 가른다 —
            앞줄은 가늘고 옅게, 뒷줄은 굵고 위에서 아래로 밝기가 빠지는 그라디언트로. */}
        <h1 className={styles.headline}>
          <span className={styles.headlineLead}>웹 · 앱 · 업무 시스템</span>
          <span className={styles.headlineMain}>실력 위에 AI를 더한 개발팀입니다</span>
        </h1>
        <p className={styles.lead}>
          기획의 첫 줄부터 사용자의 마지막 터치까지 오래 손발 맞춘 팀이 맡습니다. 반복은
          AI로 걷어내 같은 예산에서 더 많은 범위를 만듭니다.
        </p>
      </div>

      {warpedProject && (
        <ProjectDetail project={warpedProject} onClose={() => closeProject(false)} />
      )}

      {/* 갈 곳이 있을 때만 렌더한다 (P005 §6) */}
      {nextSectionId && !warped && (
        <a className={styles.scroll} href={`#${nextSectionId}`} aria-label="아래로 이동">
          <span>아래로</span>
          <i aria-hidden="true" />
        </a>
      )}
    </section>
  )
}
