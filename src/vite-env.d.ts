/// <reference types="vite/client" />

// CSS Modules — 클래스명을 문자열로 취급. `any` 금지 규칙(CLAUDE.md §1)을 지키기 위해
// 인덱스 시그니처를 string 으로 명시한다.
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
