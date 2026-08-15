import { useEffect, useRef } from 'react'
import type { Project } from '../data/projects'
import styles from './ProjectDetail.module.css'

/**
 * 성단으로 워프해 들어갔을 때 열리는 프로젝트 상세.
 *
 * 히어로 안에서 열리는 오버레이이지 별도 페이지가 아니다. 공유 가능한 정식 상세는
 * `/works/:slug`(P004)로 따로 만든다 — 그래서 여기에는 요약만 둔다.
 *
 * 닫는 경로는 네 가지: 닫기 버튼 · Esc · 뒤로가기 · 위로 스크롤 (Intro.tsx 가 처리).
 */
export default function ProjectDetail({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // 열리면 닫기 버튼으로 포커스를 옮기고, 포커스가 패널 밖으로 새지 않게 가둔다.
  useEffect(() => {
    closeRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-detail-title"
    >
      <div className={styles.panel} ref={panelRef}>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          ref={closeRef}
          aria-label="닫기"
        >
          ←<span className={styles.closeText}>돌아가기</span>
        </button>

        <p className={styles.tag}>{project.tagline}</p>
        <h2 className={styles.name} id="project-detail-title">
          {project.name}
        </h2>
        <p className={styles.summary}>{project.summary}</p>

        <dl className={styles.meta}>
          <dt>담당 범위</dt>
          <dd>{project.role}</dd>
          <dt>기술</dt>
          <dd>
            <span className={styles.stack}>
              {project.stack.map((s) => (
                <span key={s} className={styles.chip}>
                  {s}
                </span>
              ))}
            </span>
          </dd>
        </dl>

        {project.demo && (
          <a
            className={styles.demo}
            href={project.demo.href}
            target="_blank"
            rel="noreferrer noopener"
          >
            {project.demo.label} ↗
          </a>
        )}

        <p className={styles.hint}>위로 스크롤하거나 뒤로가기를 누르면 돌아갑니다</p>
      </div>
    </div>
  )
}
