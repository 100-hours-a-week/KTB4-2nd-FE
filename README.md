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
- Vitest, React Testing Library

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
```

### 웹소켓 연결 비교 실험

테스트 환경에서 `NEXT_PUBLIC_REALTIME_EXPERIMENT=true npm run build`로 빌드하고
`npm start`로 실행합니다. 개발 서버는 같은 환경 변수로 `npm run dev`를 실행합니다.
Turbopack은 앱을 빌드하고, 실험용 SharedWorker는 같은 출처에서 읽을 수 있는 JS 파일로
별도 번들링합니다. 워커 소스를 수정한 뒤에는 개발 서버를 다시 시작합니다.
Docker에서 테스트하려면 빌드 인자 `--build-arg NEXT_PUBLIC_REALTIME_EXPERIMENT=true`를 사용합니다.

여행 수정 주소 끝에 `?realtimeExperiment=baseline`을 붙여 새로고침합니다.
다른 조건에서는 `baseline`을 `focus`, `visible`, `shared`로 바꿉니다.
모든 측정 대상 탭에 같은 값을 사용합니다. 선택한 모드는 해당 탭에서 새로고침해도
유지됩니다. `shared`를 지원하지 않거나 워커 시작이 실패하면 기존 탭별 연결로 돌아가며
`fallback` 로그를 남깁니다. 실험 플래그의 기본값은 꺼짐입니다.

1. 같은 브라우저 프로필과 계정으로 같은 여행 수정 화면을 1개, 2개, 4개 엽니다.
   한 창에 탭을 모은 경우와 두 창을 나란히 띄운 경우를 나눕니다. 이름을 바꿀 협업자는
   별도 프로필과 계정을 사용합니다. 조건마다 5회 반복합니다.
2. 브라우저 수준 네트워크 기록 또는 서버의 연결 지표에서 서비스 웹소켓만 집계합니다.
   개발 서버의 HMR 연결, STOMP 구독, 협업자 프로필은 제외합니다. 연결이 안정된 뒤
   열린 연결 수를 적고, 두 창을 10회 오가며 새로 열린 연결도 셉니다.
   탭과 SharedWorker의 콘솔에서 `[realtime-experiment]`로 필터링하면
   `socket-open`과 `socket-close`가 나옵니다. `source`와 `connection` 조합이 연결 하나의
   식별자입니다. 탭을 닫을 때 콘솔 로그가 사라질 수 있으므로 연결 종료는 브라우저 수준
   기록이나 서버 지표로 확인합니다.
3. 협업자가 저장을 누른 순간부터 내 각 창에 이름이 표시되는 순간까지 기록합니다.
   성공한 시간은 중앙값을 사용하고, 저장 후 15초 안에 보이는 창에 표시되지 않으면
   갱신 누락으로 기록합니다. 저장 직후 탭을 숨겼다가 돌아오는 경우에는 저장 성공 여부와
   최종 이름을 따로 확인합니다.
4. `shared`에서는 한 탭을 유지한 채 다른 탭을 20회 열고 닫습니다. 워커 콘솔의
   `worker-counts`에서 포트, 서버 구독, 탭 구독 수가 처음 수준으로 돌아오는지 확인합니다.
   종료 통지가 누락되면 포트는 마지막 응답에서 120초 뒤부터 다음 정리 주기(15초 이내)에
   정리됩니다. 탭 하나를 닫은 뒤 남은 탭의 저장과 편집 중 표시도 확인합니다.
5. 연결 복구, 서로 다른 여행의 알림 분리, 두 탭에서 동시에 저장할 때 결과 분리,
   미지원 또는 워커 로드 실패 후 탭별 연결을 확인합니다.

| 실험 | 창 배치 | 탭 수 | 동시 연결 | 창 전환 10회당 새 연결 | 이름 반영 중앙값 | 갱신 누락 | 저장 실패 |
| ---- | ------- | ----- | --------- | ---------------------- | ---------------- | --------- | --------- |
| [ ]  | [ ]     | [ ]개 | [ ]개     | [ ]회                  | [ ]ms            | [ ]건     | [ ]건     |

SharedWorker의 실험 목표는 탭 2개와 4개에서 동시 연결 1개를 유지하면서 저장 실패와
갱신 누락이 없는 것입니다. 이 결과는 테스트 조건에서의 연결 수이며, 운영 도입 여부는
실제 다중 탭 사용량을 확인한 뒤 판단합니다.
