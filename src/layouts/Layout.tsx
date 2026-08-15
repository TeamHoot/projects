import { Outlet } from 'react-router-dom'
import styles from './Layout.module.css'

/**
 * 공통 셸 — 헤더 · 본문 · 푸터.
 *
 * 스캐폴드 단계(Phase 0)의 최소 구현이다. 공통 헤더/푸터의 실제 명세는
 * docs/plans/P005-home.md §0 범위이며, PLAN_REVIEW 승인 후 P005-DEV에서 채운다.
 */
export default function Layout() {
  return (
    <>
      <header className={styles.header}>
        <div className={`wrap ${styles.bar}`}>
          <a href="/" className={styles.logo}>
            HOOT
          </a>
          {/* 내비게이션·CTA는 P005-DEV에서 구현 */}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className="wrap">
          <p className={styles.footNote}>© HOOT. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
