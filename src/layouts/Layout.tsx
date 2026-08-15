import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

/**
 * 공통 셸 — 헤더 · 본문 · 푸터.
 *
 * 헤더/푸터의 최종 명세는 docs/plans/P005-home.md §3 이며, 메뉴·상담 CTA 는
 * PLAN_REVIEW 승인 후 채운다. 지금은 히어로가 성립하는 데 필요한 만큼만 있다.
 */

/**
 * 어두운 풀스크린 히어로로 시작하는 라우트.
 * 이 페이지에서는 헤더가 배경 없이 히어로 위에 떠 있다가, 스크롤하면 흰 바탕으로 바뀐다.
 * 본문 상단 여백도 주지 않는다 — 히어로가 화면 맨 위부터 시작해야 하기 때문이다.
 */
const DARK_HEADER_ROUTES = new Set(['/'])

export default function Layout() {
  const { pathname } = useLocation()
  const overHero = DARK_HEADER_ROUTES.has(pathname)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!overHero) return
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overHero])

  // 히어로 위에 떠 있고 아직 스크롤 전일 때만 투명 헤더
  const transparent = overHero && !scrolled

  return (
    <>
      <header className={`${styles.header} ${transparent ? styles.onHero : ''}`}>
        <div className={`wrap ${styles.bar}`}>
          <Link to="/" className={styles.logo}>
            TeamHoot
          </Link>
          {/* 내비게이션·상담 CTA는 P005-DEV에서 구현 */}
        </div>
      </header>

      <main className={overHero ? styles.mainFlush : styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className="wrap">
          <p className={styles.footNote}>© 2026 TeamHoot. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
