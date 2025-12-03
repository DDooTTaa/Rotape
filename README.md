# Rotape - 로테이션 소개팅 서비스

로테이션 소개팅 서비스입니다.

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Firebase (Firestore, Storage, Auth)

## 컬러 테마

- 배경색: #0B3D15 (딥그린)
- 글자색: #FFFFFF (하양)
- 포인트 색: #C5A028 (어두운 골드)

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 운영자 키 (운영자 모드 로그인 시 사용)
NEXT_PUBLIC_ADMIN_KEY=admin1234

# 운영자 이메일 (선택사항, 기본값: admin@rotape.com)
NEXT_PUBLIC_ADMIN_EMAIL=admin@rotape.com

# SMS 전송 (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

**참고**: 
- 운영자 키는 기본값이 `admin1234`입니다. 프로덕션 환경에서는 반드시 변경하세요.
- 운영자 모드를 선택하면 운영자 키만으로 로그인할 수 있습니다 (소셜 로그인 불필요).
- Firebase Console에서 "이메일/비밀번호" 로그인을 활성화해야 합니다.

## 설치 및 실행

```bash
npm install
npm run dev
```

## 배포

Vercel을 사용한 배포 방법은 [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) 파일을 참고하세요.

## 주요 기능

### 참가자용
- **랜딩 페이지**: 서비스 소개, 참가 안내, FAQ
- **소셜 로그인**: Google, Apple 소셜 로그인 지원
- **지원서 작성**: 
  - 기본 정보 (이름, 성별, 생년, 키, 직업)
  - 사진 업로드 (3장 필수)
  - 자기소개 및 이상형
  - 사랑의 언어 순위 선택
- **승인 안내**: 프로필 확정, 행사 일시/장소 안내, QR 코드 발급
- **행사 당일 대시보드**: 
  - 타임라인 확인
  - 현재 라운드 정보
  - 아이스브레이킹 툴 (랜덤 질문, 밸런스 게임)
  - 프로필 카드 조회
- **로테이션 매칭**: 1, 2, 3순위 선택 및 메시지 작성
- **최종 매칭 결과**: 매칭된 이성 프로필 및 채팅방

### 운영자용
- **지원자 관리**: 
  - 지원서 검토 및 승인/거절
  - 필터링 (이름, 직업, 나이, 성별, 상태)
  - 상세 정보 확인
- **행사 설정**: 
  - 행사 일시/장소 설정
  - 타임라인 관리 (인트로, 1부, 2부, 쉬는 시간)
  - 참가자 선발 및 프로필 생성
  - QR 코드 자동 생성
- **로테이션 진행**: 
  - 라운드 시작/종료
  - 참가자 배정 확인
  - 라운드 히스토리
- **매칭 결과 관리**: 
  - 참가자별 선택 결과 확인
  - 자동 매칭 알고리즘 실행
  - 커플 리스트 생성
  - 인기 순위 집계

## 프로젝트 구조

```
app/
├── admin/              # 운영자 페이지
│   ├── applications/   # 지원자 관리
│   ├── event/          # 행사 설정
│   ├── matching/       # 매칭 결과
│   └── rotation/       # 로테이션 진행
├── participant/        # 참가자 페이지
│   ├── application/    # 지원서 작성
│   ├── approved/       # 승인 안내
│   ├── auth/           # 로그인
│   ├── event/          # 행사 당일
│   ├── profile/        # 프로필 조회
│   ├── results/        # 매칭 결과
│   └── rotation/       # 로테이션 선택
└── page.tsx            # 메인 페이지

lib/
├── firebase/           # Firebase 관련 함수
│   ├── applications.ts # 지원서 관리
│   ├── config.ts       # Firebase 초기화
│   ├── events.ts       # 행사 관리
│   ├── matching.ts     # 매칭 알고리즘
│   ├── profiles.ts     # 프로필 관리
│   ├── rounds.ts       # 라운드 관리
│   ├── storage.ts      # 파일 업로드
│   ├── types.ts        # TypeScript 타입
│   └── users.ts        # 사용자 관리
└── utils/
    └── qrcode.ts       # QR 코드 생성
```

## Firebase 데이터베이스 구조

- `users`: 회원 계정 기본 정보
- `applications`: 지원서
- `profiles`: 확정 참가자 프로필
- `events`: 행사 정보
- `rounds`: 라운드별 데이터
- `likes`: 로테이션 선택 기록
- `matches`: 최종 매칭 결과
- `feedback`: 후기 설문

## 주의사항

- Firebase 프로젝트를 먼저 생성하고 환경 변수를 설정해야 합니다.
- Firebase Storage 규칙을 설정하여 파일 업로드를 허용해야 합니다.
- Firestore 보안 규칙을 적절히 설정해야 합니다.

