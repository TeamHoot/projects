import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
import { ROUTER_BASENAME } from '../site.config'
import './styles/global.css'

// 빌드타임 프리렌더 진입점 (CLAUDE.md §1).
// HashRouter·404 폴백을 쓰지 않는다 — 라우트마다 실제 HTML 파일이 나와야 한다.
//
// basename 은 vite 의 base 와 같은 값이어야 한다. 어긋나면 링크는 맞는데
// 라우터가 매칭에 실패해 빈 화면이 뜬다 — site.config.ts 에서 함께 끌어온다.
export const createRoot = ViteReactSSG({ routes, basename: ROUTER_BASENAME })
