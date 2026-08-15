import { useEffect, useRef } from 'react'
import styles from './Intro.module.css'

/**
 * 인트로 히어로 — 검은 우주 + 커서 반응 3D 틸트 격자 + 별 필드.
 *
 * 배경에 실제 프로젝트 화면을 흘려 "무엇을 만드는가"를 말 없이 보여주는 구조는
 * 레퍼런스(educomproject.co.kr)에서 가져왔다. 다만 움직임은 바꿨다 —
 * 레퍼런스는 패널이 z축으로 날아오는 자동 재생이고, 여기서는 패널이 제자리에 고정된 채
 * 화면 전체가 커서를 따라 기울어진다. 움직임의 주도권이 사용자에게 있고,
 * 카피 뒤로 패널이 지나가지 않아 가독성이 안정적이다.
 *
 * 패널 배치와 별 그리기는 전부 useEffect 안에서 한다. Math.random 을 렌더 중에 쓰면
 * 프리렌더 HTML 과 클라이언트 결과가 달라져 하이드레이션이 깨진다.
 */

/** 패널에 쓸 실제 프로젝트 화면. public/images/intro/ (포트폴리오 PDF 에서 추출) */
const WIDE = ['w1', 'w2', 'w3'] as const
const TALL = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'] as const

const MOBILE_BREAKPOINT = 820
const PERSPECTIVE = 1000

/** 기울기 최대치. 더 키우면 패널이 옆면을 보여 화면이 무너진다. */
const MAX_TILT_Y = 13
const MAX_TILT_X = 9
/** 커서를 따라가는 속도. 1 이면 즉각, 낮을수록 묵직하다. */
const EASING = 0.075

type IntroProps = {
  /** 스크롤 안내가 가리킬 다음 섹션 id. 없으면 안내를 렌더하지 않는다. */
  nextSectionId?: string
}

export default function Intro({ nextSectionId }: IntroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const spaceRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ── 패널 배치 (고정) ──
  useEffect(() => {
    const space = spaceRef.current
    if (!space) return

    const narrow = window.innerWidth < MOBILE_BREAKPOINT
    const count = narrow ? 10 : 16
    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    const wOff = Math.floor(Math.random() * WIDE.length)
    const tOff = Math.floor(Math.random() * TALL.length)

    const vw = window.innerWidth
    const vh = window.innerHeight
    const wideW = narrow ? 236 : 430
    const tallW = narrow ? 104 : 168

    const created: HTMLDivElement[] = []

    for (let i = 0; i < count; i++) {
      // 보유 이미지가 세로(모바일) 쪽이 훨씬 많아 3개 중 2개를 세로로 뽑는다.
      const tall = i % 3 !== 0
      const pool = tall ? TALL : WIDE
      const idx = (Math.floor(i / 3) + (tall ? tOff : wOff)) % pool.length
      const name = pool[idx] ?? pool[0]

      const w = tall ? tallW : wideW
      const h = tall ? Math.round(w * 2.16) : Math.round(w * 0.625)

      // 깊이. 멀수록 어둡고, 기울일 때 가까운 것과 어긋나며 시차가 생긴다.
      const depth = rand(140, 880)
      // 원근 때문에 먼 패널은 저절로 작아지고 중앙으로 당겨진다.
      // 화면상 위치를 의도대로 두려면 그만큼 좌표를 벌려줘야 한다.
      const spread = (PERSPECTIVE + depth) / PERSPECTIVE

      // 중앙(카피 자리)을 비우고 링 형태로 배치한다.
      const ang = (i / count) * Math.PI * 2 + rand(-0.26, 0.26)
      const rx = narrow ? rand(vw * 0.42, vw * 0.78) : rand(vw * 0.29, vw * 0.52)
      const ry = narrow ? rand(vh * 0.26, vh * 0.46) : rand(vh * 0.27, vh * 0.48)

      let px = Math.cos(ang) * rx
      let py = Math.sin(ang) * ry

      // 좁은 화면에서는 카피가 폭을 거의 다 써서 좌우로는 패널을 피할 수 없다.
      // 카피가 걸치는 가로 띠 안에 들어온 패널은 위아래로 밀어낸다.
      if (narrow) {
        const band = vh * 0.3
        if (Math.abs(py) < band) py = (py < 0 ? -1 : 1) * (band + Math.random() * vh * 0.18)
      }

      const el = document.createElement('div')
      el.className = styles.panel ?? ''
      el.style.cssText =
        `--w:${w}px;--h:${h}px;` +
        `--x:${Math.round(px * spread)}px;` +
        `--y:${Math.round(py * spread)}px;` +
        `--z:${-Math.round(depth)}px;` +
        `--rx:${rand(-7, 7).toFixed(1)}deg;--ry:${rand(-13, 13).toFixed(1)}deg;` +
        // 먼 것일수록 옅게 — 깊이를 밝기로도 알려준다
        `--op:${(0.86 - (depth / 880) * 0.5).toFixed(2)}`

      const img = document.createElement('img')
      img.src = `${import.meta.env.BASE_URL}images/intro/${name}.jpg`
      img.alt = ''
      img.loading = i < 6 ? 'eager' : 'lazy'
      img.decoding = 'async'

      el.appendChild(img)
      space.appendChild(el)
      created.push(el)
    }

    return () => created.forEach((el) => el.remove())
  }, [])

  // ── 커서를 따라가는 기울기 ──
  useEffect(() => {
    const space = spaceRef.current
    const section = sectionRef.current
    if (!space || !section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // 커서가 없는 기기(모바일)에서는 아주 느린 자체 흔들림만 준다.
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
      // 화면 중심 기준 -0.5 ~ 0.5
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
        // 아주 느린 8자 흔들림 — 화면이 죽어 보이지 않을 정도만
        const t = (now - start) / 1000
        targetX = Math.sin(t * 0.16) * 0.32
        targetY = Math.sin(t * 0.11) * 0.22
      }
      curX += (targetX - curX) * EASING
      curY += (targetY - curY) * EASING
      space.style.transform =
        `rotateY(${(curX * MAX_TILT_Y).toFixed(2)}deg) ` +
        `rotateX(${(-curY * MAX_TILT_X).toFixed(2)}deg) ` +
        // 기울기와 반대로 살짝 밀어 시차를 키운다
        `translate3d(${(-curX * 26).toFixed(1)}px, ${(-curY * 18).toFixed(1)}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    if (hasPointer) {
      section.addEventListener('pointermove', onMove)
      section.addEventListener('pointerleave', onLeave)
    }
    raf = requestAnimationFrame(tick)

    // 화면 밖이면 멈춘다 (배터리·성능)
    const io = new IntersectionObserver(
      (entries) => {
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
        })
      },
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
  }, [])

  // ── 별 필드 ──
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
    let stars: { a: number; r: number; s: number; z: number }[] = []
    let raf = 0
    let live = true

    const build = () => {
      w = section.clientWidth
      h = section.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round(Math.min(220, (w * h) / 9000))
      stars = Array.from({ length: n }, () => ({
        a: Math.random() * Math.PI * 2,
        r: Math.random() * Math.max(w, h) * 0.62,
        s: 0.06 + Math.random() * 0.24,
        z: Math.random(),
      }))
    }

    const draw = () => {
      if (!live) return
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h * 0.46
      for (const st of stars) {
        // z 가 클수록 빠르고 크고 밝다 — 이 차이가 원근감을 만든다.
        st.r += st.s * (0.4 + st.z * 1.6)
        if (st.r > Math.max(w, h) * 0.75) {
          st.r = Math.random() * 40
          st.a = Math.random() * Math.PI * 2
        }
        const x = cx + Math.cos(st.a) * st.r
        const y = cy + Math.sin(st.a) * st.r * 0.82
        const size = 0.5 + st.z * 1.5
        const op = 0.14 + st.z * 0.55
        ctx.fillStyle = `rgba(${190 + Math.round(st.z * 60)},${210 + Math.round(st.z * 45)},255,${op})`
        ctx.fillRect(x, y, size, size)
      }
      raf = requestAnimationFrame(draw)
    }

    build()
    draw()

    const onResize = () => build()
    window.addEventListener('resize', onResize)

    const io = new IntersectionObserver(
      (entries) => {
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
        })
      },
      { threshold: 0 },
    )
    io.observe(section)

    return () => {
      live = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      io.disconnect()
    }
  }, [])

  return (
    <section className={styles.intro} ref={sectionRef} id="intro">
      <canvas className={styles.stars} ref={canvasRef} aria-hidden="true" />
      <div className={styles.space} ref={spaceRef} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.copy}>
        <p className={styles.eyebrow}>설계 26년차 리드 · 전담 QA 보유</p>
        {/* 주어는 '실력 있는 팀'이고 AI 는 그 팀이 쓰는 도구다. 순서를 뒤집으면
            AI 로 찍어내는 팀처럼 읽힌다. 각 줄은 레퍼런스와 같은 13~17자로 맞춘다. */}
        <h1 className={styles.headline}>
          웹 · 앱 · 업무 시스템
          <br />
          실력 위에 AI를 더한 <span className={styles.em}>개발팀</span>입니다
        </h1>
        <p className={styles.lead}>
          기획의 첫 줄부터 사용자의 마지막 터치까지 오래 손발 맞춘 팀이 맡습니다. 반복은
          AI로 걷어내 같은 예산에서 더 많은 범위를 만듭니다.
        </p>
      </div>

      {/* 갈 곳이 있을 때만 렌더한다 (P005 §6) */}
      {nextSectionId && (
        <a className={styles.scroll} href={`#${nextSectionId}`} aria-label="아래로 이동">
          <span>아래로</span>
          <i aria-hidden="true" />
        </a>
      )}
    </section>
  )
}
