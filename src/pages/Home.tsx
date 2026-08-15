import { Head } from 'vite-react-ssg'
import Intro from '../components/Intro'

/**
 * 랜딩 `/` — P005 HOME.
 *
 * 1차 범위는 공통 헤더 · 히어로 · 전역 플로팅 상담 · 공통 푸터다(P005 §0).
 * 현재 히어로까지 구현했고, 플로팅 상담은 OPEN[F1](Firebase) 해소 후 붙인다.
 *
 * 히어로 아래에 아직 섹션이 없으므로 `nextSectionId` 를 넘기지 않는다 —
 * 스크롤 안내가 갈 곳 없이 렌더되는 것을 막는다.
 */
export default function Home() {
  return (
    <>
      <Head>
        <title>TeamHoot — 웹 · 앱 · 업무 시스템 개발팀</title>
        <meta
          name="description"
          content="기획의 첫 줄부터 사용자의 마지막 터치까지 같은 팀이 맡습니다. 반복은 AI로 줄이고 설계와 판단은 사람이 하는, 설계 26년차가 리드하는 개발팀입니다."
        />
      </Head>

      <Intro />
    </>
  )
}
