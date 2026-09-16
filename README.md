# 여담 프론트엔드

여행의 사진과 이야기를 기록하고 공유하는 여담의 프론트엔드 프로젝트입니다.

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript 6
- Tailwind CSS 4
- TanStack Query 5
- Zustand
- React Hook Form
- Vitest, React Testing Library, Playwright

## 폴더 구조

```text
app/                Next.js App Router 어댑터
src/
├── _app/           Provider, 전역 스타일, 루트 레이아웃
├── _pages/         URL에 연결되는 완성 화면
├── widgets/        여러 하위 Layer를 조합한 화면 블록
├── features/       사용자 행동 단위 기능
├── entities/       회원, 여행, 사진, 스토리 등 도메인
└── shared/         공통 UI, API, 환경 설정
```

`app/`에는 라우팅 연결 코드만 두고 실제 화면과 비즈니스 코드는 `src/`의 FSD Layer에 둡니다.
정적 이미지와 아이콘은 `public/`, CI 워크플로는 `.github/workflows/`에 둡니다.

## 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
npm run format       # Prettier 적용
npm run format:check # Prettier 적용 여부 검사
npm run typecheck    # Next.js 타입 생성 및 TypeScript 검사
npm test             # 단위·컴포넌트 테스트 1회 실행
npm run test:watch   # Vitest 감시 모드
npm run test:e2e     # Playwright E2E 테스트
```

처음 E2E 테스트를 실행하기 전에는 Chromium을 설치합니다.

```bash
npx playwright install chromium
```
