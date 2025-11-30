# 환경 설정 가이드

개발 서버와 라이브 서버를 분리하기 위한 환경 설정 가이드입니다.

## 1. 환경 변수 파일 생성

### 개발 환경 (.env.local)

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 개발 환경
NEXT_PUBLIC_ENV=development

# Firebase 개발 프로젝트 설정
NEXT_PUBLIC_FIREBASE_API_KEY=개발용_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=개발용_프로젝트.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=개발용_프로젝트_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=개발용_프로젝트.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=개발용_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=개발용_app_id
```

### 프로덕션 환경 (Vercel)

Vercel 대시보드에서 환경 변수를 설정하세요:

1. Vercel 프로젝트 → Settings → Environment Variables
2. 다음 변수들을 추가:
   - `NEXT_PUBLIC_ENV` = `production`
   - `NEXT_PUBLIC_FIREBASE_API_KEY` = 프로덕션 API 키
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = 프로덕션 도메인
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = 프로덕션 프로젝트 ID
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = 프로덕션 스토리지 버킷
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = 프로덕션 Sender ID
   - `NEXT_PUBLIC_FIREBASE_APP_ID` = 프로덕션 App ID

3. 각 변수에 대해 "Production" 환경을 선택

## 2. Firebase 프로젝트 분리

### 개발용 Firebase 프로젝트 생성

1. Firebase Console (https://console.firebase.google.com) 접속
2. 새 프로젝트 생성 (예: `rotape-dev`)
3. 웹 앱 추가
4. 설정 정보를 `.env.local`에 복사

### 프로덕션용 Firebase 프로젝트 생성

1. Firebase Console에서 별도 프로젝트 생성 (예: `rotape-prod`)
2. 웹 앱 추가
3. 설정 정보를 Vercel 환경 변수에 복사

## 3. 환경 확인

개발 서버 실행 시 콘솔에서 다음 메시지를 확인할 수 있습니다:

```
✅ Firebase 설정 완료 - 환경: 개발
프로젝트 ID: your_dev_project_id
```

프로덕션 빌드 시에는 프로덕션 환경으로 설정됩니다.

## 4. 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- 프로덕션 환경 변수는 Vercel 대시보드에서만 관리하세요
- 개발과 프로덕션 Firebase 프로젝트의 데이터는 완전히 분리됩니다

