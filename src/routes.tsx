import type { RouteRecord } from 'vite-react-ssg'
import Layout from './layouts/Layout'
import Home from './pages/Home'

// IA 원본: docs/plans/IA.md (v2 — 포트폴리오 + 상담 축).
// 아직 스캐폴드 단계라 `/` 하나만 등록한다. 나머지 화면은 각 UNIT의 DEV 단계에서
// BUILD_ORDER Phase 순서대로 붙인다:
//   /contact (P006) · /about (P001) · /how-we-work (P002)
//   /works (P003) · /works/:slug (P004 — 8건 전부 빌드 시 프리렌더)
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [{ index: true, element: <Home /> }],
  },
]
