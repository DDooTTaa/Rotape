# Vercel 배포 가이드

이 문서는 Rotape 프로젝트를 Vercel에 배포하는 방법을 안내합니다.

## 1. 사전 준비

### 1.1 GitHub 저장소 준비
1. 프로젝트를 GitHub에 푸시합니다:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/rotape.git
   git push -u origin main
   ```

### 1.2 Firebase 설정 확인
- Firebase 프로젝트가 생성되어 있어야 합니다
- Firebase Console에서 웹 앱이 등록되어 있어야 합니다
- Firebase Authentication, Firestore, Storage가 활성화되어 있어야 합니다

## 2. Vercel 배포

### 방법 1: Vercel 웹 대시보드 사용 (권장)

1. **Vercel 계정 생성**
   - [https://vercel.com](https://vercel.com)에 접속
   - GitHub 계정으로 로그인

2. **프로젝트 가져오기**
   - "Add New..." → "Project" 클릭
   - GitHub 저장소 선택
   - "Import" 클릭

3. **프로젝트 설정**
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)

4. **환경 변수 설정**
   - "Environment Variables" 섹션에서 다음 변수들을 추가:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id (선택사항)
   NEXT_PUBLIC_ADMIN_KEY=your_admin_key
   NEXT_PUBLIC_ADMIN_EMAIL=admin@rotape.com (선택사항)
   ```

   **중요**: 
   - 각 환경 변수는 `.env.local` 파일의 값과 동일해야 합니다
   - `NEXT_PUBLIC_` 접두사가 있는 변수는 클라이언트에서 접근 가능합니다
   - 운영자 키는 프로덕션 환경에서 반드시 변경하세요

5. **배포**
   - "Deploy" 버튼 클릭
   - 빌드가 완료되면 배포 URL이 생성됩니다

### 방법 2: Vercel CLI 사용

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **로그인**
   ```bash
   vercel login
   ```

3. **배포**
   ```bash
   vercel
   ```
   
   첫 배포 시:
   - 프로젝트 설정 질문에 답변
   - 환경 변수 입력 (또는 나중에 Vercel 대시보드에서 설정)

4. **프로덕션 배포**
   ```bash
   vercel --prod
   ```

## 3. 환경 변수 설정

### Vercel 대시보드에서 환경 변수 설정

1. 프로젝트 대시보드 → "Settings" → "Environment Variables"
2. 각 환경 변수를 추가:
   - **Name**: 환경 변수 이름 (예: `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - **Value**: 환경 변수 값
   - **Environment**: Production, Preview, Development 모두 선택

### 환경 변수 목록

필수 환경 변수:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_ADMIN_KEY`

선택적 환경 변수:
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (Google Analytics 사용 시)
- `NEXT_PUBLIC_ADMIN_EMAIL` (기본값: admin@rotape.com)

## 4. Firebase 설정 업데이트

### 4.1 인증된 도메인 추가

1. Firebase Console → Authentication → Settings
2. "Authorized domains" 섹션에서 Vercel 도메인 추가:
   - `your-project.vercel.app`
   - 커스텀 도메인 사용 시 해당 도메인도 추가

### 4.2 Firestore 보안 규칙 확인

프로덕션 환경에 맞게 보안 규칙을 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 인증 필요
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /applications/{applicationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // 기타 컬렉션 규칙...
  }
}
```

### 4.3 Storage 보안 규칙 확인

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 5. 배포 후 확인 사항

1. **배포 URL 접속**
   - Vercel 대시보드에서 제공하는 URL로 접속
   - 예: `https://rotape.vercel.app`

2. **기능 테스트**
   - 로그인 기능 테스트
   - 지원서 작성 테스트
   - Firebase 연결 확인

3. **콘솔 에러 확인**
   - 브라우저 개발자 도구에서 에러 확인
   - Vercel 대시보드의 "Functions" 탭에서 서버 로그 확인

## 6. 커스텀 도메인 설정 (선택사항)

1. Vercel 대시보드 → 프로젝트 → "Settings" → "Domains"
2. 도메인 추가
3. DNS 설정 안내에 따라 도메인 제공업체에서 DNS 레코드 설정

## 7. 자동 배포 설정

GitHub에 푸시할 때마다 자동으로 배포되도록 설정됩니다:
- `main` 브랜치에 푸시 → 프로덕션 배포
- 다른 브랜치에 푸시 → 프리뷰 배포

## 8. 문제 해결

### 빌드 실패
- Vercel 대시보드의 "Deployments" 탭에서 빌드 로그 확인
- 환경 변수가 올바르게 설정되었는지 확인
- `package.json`의 빌드 스크립트 확인

### Firebase 연결 실패
- 환경 변수가 올바르게 설정되었는지 확인
- Firebase Console에서 인증된 도메인이 추가되었는지 확인
- Firestore 및 Storage 보안 규칙 확인

### 런타임 에러
- Vercel 대시보드의 "Functions" 탭에서 로그 확인
- 브라우저 콘솔에서 클라이언트 에러 확인

## 9. 추가 리소스

- [Vercel 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Firebase 웹 설정](https://firebase.google.com/docs/web/setup)

