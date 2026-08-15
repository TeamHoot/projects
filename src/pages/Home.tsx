import { Head } from 'vite-react-ssg'
import styles from './Home.module.css'

/**
 * 랜딩 `/` — P005 HOME.
 *
 * 지금은 스캐폴드 자리표시자다. 실제 1차 범위(공통 헤더 · 히어로 ·
 * 전역 플로팅 상담 · 공통 푸터)는 docs/plans/P005-home.md 가 PLAN_REVIEW 게이트를
 * 통과한 뒤 P005-DEV 에서 구현한다. 여기서 화면을 추측해 만들지 않는다 (CLAUDE.md §3-1).
 */
export default function Home() {
  return (
    <>
      <Head>
        <title>HOOT — 스타트업 시스템을 기획·설계·개발하는 고정 팀</title>
        <meta
          name="description"
          content="2019년부터 스타트업의 시스템을 기획·설계·개발하고 런칭 후 운영까지 함께하는 고정 팀."
        />
      </Head>

      <section className={styles.placeholder}>
        <div className="wrap">
          <p className={styles.eyebrow}>SCAFFOLD</p>
          <h1 className={styles.title}>HOOT 포트폴리오</h1>
          <p className={styles.desc}>
            빌드타임 프리렌더 파이프라인 확인용 화면입니다. 실제 랜딩은 P005 기획 명세
            승인 후 구현합니다.
          </p>
        </div>
      </section>
    </>
  )
}
