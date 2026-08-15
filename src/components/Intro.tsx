import { useEffect, useRef } from 'react'
import styles from './Intro.module.css'

/**
 * 인트로 히어로 — 검은 우주 + 3D 패널 워프 + 별 필드.
 *
 * 레퍼런스(educomproject.co.kr)의 `.intro` 구조를 실측해 옮긴 것이다.
 * 핵심은 장식이 아니라는 점 — 떠다니는 패널은 **실제 프로젝트 화면**이다.
 * 카피는 정면에, 실적은 배경에 흐르게 해 "무엇을 만드는가"를 말 없이 보여준다.
 *
 * 패널 생성과 별 그리기는 전부 useEffect 안에서 한다. Math.random 을 렌더 중에 쓰면
 * 프리렌더 HTML 과 클라이언트 결과가 달라져 하이드레이션이 깨진다.
 */

/** 패널에 쓸 실제 프로젝트 화면. public/images/intro/ (포트폴리오 PDF 에서 추출) */
const WIDE = ['w1', 'w2', 'w3'] as const
const TALL = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'] as const

const MOBILE_BREAKPOINT = 820

type IntroProps = {
  /** 스크롤 안내가 가리킬 다음 섹션 id. 없으면 안내를 렌더하지 않는다. */
  nextSectionId?: string
}

export default function Intro({ nextSectionId }: IntroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const spaceRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ── 3D 패널 배치 ──
  useEffect(() => {
    const space = spaceRef.current
    if (!space) return

    const narrow = window.innerWidth < MOBILE_BREAKPOINT
    const count = narrow ? 10 : 16
    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    // 방문할 때마다 다른 조합이 나오게 풀 시작점을 랜덤 회전한다.
    const wOff = Math.floor(Math.random() * WIDE.length)
    const tOff = Math.floor(Math.random() * TALL.length)

    const vw = window.innerWidth
    const vh = window.innerHeight
    const wideW = narrow ? 236 : 430
    const tallW = narrow ? 104 : 168

    const created: HTMLDivElement[] = []

    for (let i = 0; i < count; i++) {
      // 보유 이미지가 세로(모바일) 쪽이 훨씬 많아 3개 중 2개를 세로로 뽑는다.
      // 레퍼런스는 1:1 이지만 그대로 하면 와이드 3장이 과하게 반복된다.
      const tall = i % 3 !== 0
      const pool = tall ? TALL : WIDE
      const idx = (tall ? Math.floor(i / 3) + tOff : Math.floor(i / 3) + wOff) % pool.length
      const name = pool[idx] ?? pool[0]

      const w = tall ? tallW : wideW
      const h = tall ? Math.round(w * 2.16) : Math.round(w * 0.625)

      // 중앙(카피 자리)을 비우고 링 형태로 배치한다.
      const ang = (i / count) * Math.PI * 2 + rand(-0.24, 0.24)
      const rx = narrow ? rand(vw * 0.44, vw * 0.86) : rand(vw * 0.3, vw * 0.54)
      const ry = narrow ? rand(vh * 0.24, vh * 0.46) : rand(vh * 0.26, vh * 0.5)

      const dur = rand(15, 23)
      // 음수 delay — 로드 순간 이미 저마다 다른 지점을 비행 중이게 만든다.
      const delay = -(i / count) * dur - rand(0, 1.4)

      const el = document.createElement('div')
      el.className = styles.panel ?? ''
      el.style.cssText =
        `--w:${w}px;--h:${h}px;` +
        `--x:${Math.round(Math.cos(ang) * rx)}px;--y:${Math.round(Math.sin(ang) * ry)}px;` +
        `--rx:${rand(-9, 9).toFixed(1)}deg;--ry:${rand(-16, 16).toFixed(1)}deg;` +
        `--dur:${dur.toFixed(1)}s;--delay:${delay.toFixed(1)}s`

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

    // 화면 밖으로 나가면 멈춘다 (배터리·성능)
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
