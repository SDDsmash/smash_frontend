# Smash Frontend 세팅 & 실행 가이드

## 1. 사전 준비

- **Node.js** 18 이상 설치 (LTS 권장)
- 패키지 관리자: `pnpm`(권장) 또는 `npm`
  - `pnpm` 설치: `npm install -g pnpm`

## 2. 리포지토리 클론

```bash
git clone <repo-url>
cd smash_frontend
```

## 3. 환경 변수 설정

백엔드 API 와 통신하려면 `VITE_API_BASE_URL`을 지정해야 합니다.

1. 프로젝트 루트에 `.env.local` 파일 생성
2. 다음 내용을 작성 (예시는 로컬 서버 8080 포트)

```bash
VITE_API_BASE_URL=http://localhost:8080
```

> 운영 환경에서는 실제 배포된 백엔드 엔드포인트로 교체하고, 백엔드 `front_url` 설정에 해당 도메인이 포함돼야 CORS 가 허용됩니다. 레이트 리밋(HTTP 429)이 발생하면 `Retry-After` 헤더 값을 참고해 재시도 시간을 조정하세요.

## 4. 의존성 설치

```bash
pnpm install
# 또는
npm install
```

## 5. 개발 서버 실행

```bash
pnpm run dev
# 또는
npm run dev
```

브라우저에서 <http://localhost:5173> 접속 후 UI를 확인합니다.

## 6. 품질 점검 & 빌드

```bash
# 타입 검사
pnpm run typecheck

# 린트 검사
pnpm run lint

# 프로덕션 빌드 산출물 생성
pnpm run build
```

생성된 빌드 결과물은 `dist/` 디렉터리에 저장됩니다. 원하는 호스팅 환경에 업로드해 배포하세요.

## 7. 추가 참고 사항

- 상세 검색 화면은 백엔드의 직종/지원 태그 API를 직접 호출하므로, 백엔드가 기동된 상태에서 개발 서버를 실행해야 정상적으로 목록이 채워집니다.
- 로컬 개발 시 레이트 리밋이 불편하다면 백엔드 `application-dev` 프로파일에서 레이트 리밋이 비활성화되도록 구성돼 있으니 dev 모드로 실행하세요.

