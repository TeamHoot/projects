import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
import './styles/global.css'

// 빌드타임 프리렌더 진입점 (CLAUDE.md §1).
// HashRouter·404 폴백을 쓰지 않는다 — 라우트마다 실제 HTML 파일이 나와야 한다.
export const createRoot = ViteReactSSG({ routes })
