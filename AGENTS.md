<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 프론트엔드 API 경계와 구조

- 백엔드 데이터와 인증은 명세된 백엔드 엔드포인트를 기존 API 클라이언트로 직접 호출한다. 기능별 `api` 파일에는 요청 함수만 둔다. 백엔드 API가 아직 없으면 mock과 추후 연결 지점을 명확히 표시한다.
- 프론트 작업을 위해 Next.js Route Handler(`app/**/route.ts`), API Route(`pages/api`), 프록시·중계 서버 또는 백엔드 인증 로직을 새로 만들지 않는다. 사용자가 명시적으로 요청한 경우에만 추가한다.
- 현재 기능에 필요한 만큼만 구성하고 기존 모듈을 재사용한다. 직접 호출이 불가능하면 구체적인 이유와 대안을 먼저 설명한 뒤 구조를 결정한다.
