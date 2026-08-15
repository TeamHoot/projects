/**
 * 배포 경로의 단일 원본.
 *
 * GitHub Pages 는 저장소 이름이 URL 경로를 결정한다.
 *   TeamHoot/projects           → https://teamhoot.github.io/projects → "/projects/"
 *   TeamHoot/TeamHoot.github.io → https://teamhoot.github.io          → "/"
 *
 * 이 값이 vite 의 base, react-router 의 basename, Playwright 의 baseURL 세 곳에 동시에
 * 반영돼야 한다. 예전에 한 곳만 바꿔 어긋난 적이 있어 여기서만 관리한다.
 * 배포 대상을 바꾸면 이 파일과 CLAUDE.md §4 를 같은 변경에 포함한다.
 */
export const BASE_PATH = '/projects/'

/** react-router basename 은 끝 슬래시를 두지 않는다 (루트일 때는 "/"). */
export const ROUTER_BASENAME = BASE_PATH.replace(/\/$/, '') || '/'
