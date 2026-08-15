/**
 * 히어로 성단(星團)에 띄우는 프로젝트.
 *
 * 출처는 회사 포트폴리오 `hoot-portfoilo-2025.pdf` 본문이다. 이미지도 같은 PDF에서
 * 추출했고, **몇 페이지에서 나왔는지로 프로젝트를 특정했다** — 그래서 화면과 설명이
 * 어긋나지 않는다. 없는 사실을 쓰지 않는다: 성과 수치는 자료에 없어 비워 뒀다.
 *
 * 이 목록은 히어로용 요약이다. 정식 상세 페이지는 `/works/:slug`(P004)로 따로 만든다.
 */

export type ProjectImage = {
  src: string
  /** 세로(모바일 화면) 여부. 패널 비율을 결정한다. */
  tall: boolean
}

export type Project = {
  slug: string
  /** 성단 옆에 별처럼 빛나는 이름 */
  name: string
  /** 한 줄 정의 */
  tagline: string
  summary: string
  stack: string[]
  /** 우리가 맡은 범위. 부풀리지 않는다. */
  role: string
  demo?: { label: string; href: string }
  images: ProjectImage[]
}

export const PROJECTS: Project[] = [
  {
    slug: 'calltax',
    name: '콜택스',
    tagline: '부동산 세금 자동화 · 자산 관리',
    summary:
      '공공 데이터와 현행 법률을 기반으로 취득세·양도소득세·장기보유특별공제를 계산하고 개인화된 시뮬레이션을 제공하는 웹 플랫폼입니다. 자산 추적, 대화형 진단 도구, PDF 리포트 생성을 갖췄습니다.',
    stack: ['Spring Boot', 'React', 'PWA', 'Figma'],
    role: '전체 개발 주기를 리드. 기존 시스템을 반응형 PWA로 재구축',
    images: [
      { src: 'calltax-1', tall: true },
      { src: 'calltax-2', tall: true },
    ],
  },
  {
    slug: 'route',
    name: 'Route',
    tagline: '차량 캠핑 · 여행 경로 공유',
    summary:
      '차량 캠핑족과 로드트립 여행자가 대화형 지도에 경로를 그리고 여행 기록을 공유하는 모바일 커뮤니티 앱입니다. 경로 그리기, 소셜 피드, 정적 지도 스냅샷을 제공합니다.',
    stack: ['Spring Boot', 'Next.js', 'Google Maps API'],
    role: '기획·설계·프론트엔드·백엔드와 Android/iOS 패키징까지 전 과정',
    images: [
      { src: 'route-1', tall: false },
      { src: 'route-2', tall: false },
    ],
  },
  {
    slug: 'hangnon',
    name: '행복한 논술',
    tagline: '크로스플랫폼 eBook 학습 플랫폼',
    summary:
      '오래된 PHP 시스템을 전면 개편한 디지털 학습 플랫폼입니다. Android·iOS·Windows·macOS에서 실행되며 인터랙티브 eBook 뷰어, 교실 단말기 관리, 활동 기반 크레딧 시스템을 갖췄습니다.',
    stack: ['Spring Boot', 'Next.js', 'React Native', 'Electron'],
    role: '레거시 전면 개편 전 과정을 내부에서 수행',
    demo: { label: '데모 보기', href: 'http://dev.hangnon.com' },
    images: [
      { src: 'hangnon-1', tall: true },
      { src: 'hangnon-2', tall: true },
    ],
  },
  {
    slug: 'shoppingeasy',
    name: '쇼핑이지',
    tagline: '현대 M포인트 M-커머스 플랫폼',
    summary:
      '현대카드 사용자가 M포인트로 상품을 구매하는 M-커머스 플랫폼입니다. B2B·B2C를 모두 지원하며 판매자 상품 관리, 주문 추적, 리뷰, 관리자 대시보드를 갖췄습니다.',
    stack: ['Next.js', 'TypeScript'],
    // 중도 합류 건이다. 담당 범위를 부풀리지 않는다.
    role: '프로젝트 중반 합류. 메인 쇼핑몰·상품 상세·관리자 도구·사용자 계정 등 주요 페이지 개발',
    demo: { label: '서비스 보기', href: 'https://www.shoppingeasy.co.kr/' },
    images: [
      { src: 'shoppingeasy-1', tall: true },
      { src: 'shoppingeasy-2', tall: true },
      { src: 'shoppingeasy-3', tall: true },
    ],
  },
  {
    slug: 'semobae',
    name: '세모배',
    tagline: 'AI 기반 에세이 첨삭 데스크탑 앱',
    summary:
      '영어 에세이를 실시간으로 교정받으며 작문 능력을 키우는 데스크탑 플랫폼입니다. 문법·구조·일관성을 즉시 교정하고, 실시간 동기화와 진행 상황 추적을 제공합니다.',
    stack: ['React', 'Electron', 'Firebase'],
    role: '프론트엔드 개발 주도. 반응형 디자인과 UX 중심',
    images: [
      { src: 'semobae-1', tall: true },
      { src: 'semobae-2', tall: false },
    ],
  },
]
