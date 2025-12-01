# Firebase 연결 가이드

Firebase 연결을 위해 필요한 파일과 설정을 단계별로 안내합니다.

## 📋 필요한 파일 목록

### 1. `.env.local` 파일 (프로젝트 루트)
**가장 중요!** Firebase 설정 정보를 담는 환경 변수 파일입니다.

**위치**: 프로젝트 루트 디렉토리 (`/Rotape/.env.local`)

**내용**:
```env
# 개발 환경 설정
NEXT_PUBLIC_ENV=development

# Firebase 개발 프로젝트 설정
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB2N9ZZkHxxvRcl8S4XwHgnDQbIjubCIik
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rotape-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rotape-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rotape-dev.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=735719197402
NEXT_PUBLIC_FIREBASE_APP_ID=1:735719197402:web:71edfd1c2bfcc705a8b3e3

# 운영자 설정
NEXT_PUBLIC_ADMIN_KEY=admin1234
NEXT_PUBLIC_ADMIN_EMAIL=admin@rotape.com

# 사이트 URL
NEXT_PUBLIC_SITE_URL=http://localhost:3003
```

**주의사항**:
- 따옴표(`"` 또는 `'`) 없이 작성
- `=` 앞뒤에 공백 없음
- 주석은 `#`으로 시작
- 파일 이름은 정확히 `.env.local` (앞에 점 포함)

---

### 2. `lib/firebase/config.ts` 파일
Firebase 초기화 및 설정 파일입니다.

**위치**: `lib/firebase/config.ts`

**역할**:
- Firebase 앱 초기화
- Auth, Firestore, Storage 서비스 초기화
- 환경 변수 검증
- 클라이언트/서버 사이드에서 Firebase 인스턴스 제공

**필수 내용**:
- `initializeApp()` - Firebase 앱 초기화
- `getAuth()` - 인증 서비스
- `getFirestore()` - 데이터베이스 서비스
- `getStorage()` - 파일 저장소 서비스

---

### 3. `next.config.js` 파일
Next.js 설정 파일입니다.

**위치**: 프로젝트 루트 (`/Rotape/next.config.js`)

**필수 설정**:
```javascript
{
  images: {
    domains: ['firebasestorage.googleapis.com'], // Firebase Storage 이미지 로드용
  }
}
```

---

### 4. `package.json` 파일
Firebase 관련 패키지가 설치되어 있어야 합니다.

**필수 패키지**:
```json
{
  "dependencies": {
    "firebase": "^10.12.2"
  }
}
```

---

## 🔧 설정 단계

### Step 1: `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 위의 내용을 복사하여 붙여넣으세요.

**Windows에서 파일 생성 방법**:
```powershell
# PowerShell에서
New-Item -Path .env.local -ItemType File
# 그 다음 파일을 열어서 내용 입력
```

또는 VS Code나 다른 에디터에서 직접 생성하세요.

---

### Step 2: Firebase 설정 확인

`.env.local` 파일의 Firebase 설정 값들이 올바른지 확인하세요:

1. **Firebase Console** (https://console.firebase.google.com) 접속
2. 프로젝트 선택 (예: `rotape-dev`)
3. 프로젝트 설정 (⚙️) > 일반 탭
4. "내 앱" 섹션에서 웹 앱 설정 확인
5. 설정 값이 `.env.local`과 일치하는지 확인

---

### Step 3: 개발 서버 재시작

환경 변수 파일을 생성하거나 수정한 후에는 **반드시** 개발 서버를 재시작해야 합니다:

```bash
# 현재 서버 중지 (Ctrl+C)
npm run dev
```

---

## ✅ 연결 확인 방법

### 1. 브라우저 콘솔 확인

개발 서버 실행 후 브라우저 콘솔(F12)에서 다음 메시지 확인:

```
✅ Firebase 설정 완료 - 환경: 개발
프로젝트 ID: rotape-dev
```

### 2. 에러 확인

만약 다음 메시지가 보이면 환경 변수가 제대로 로드되지 않은 것입니다:

```
⚠️ Firebase 환경 변수가 설정되지 않았습니다: apiKey, authDomain, ...
```

이 경우:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 내용에 오타가 없는지 확인
3. 개발 서버를 완전히 종료 후 재시작

---

## 🚨 문제 해결

### 문제 1: 환경 변수가 `undefined`로 표시됨

**해결 방법**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env.local`인지 확인 (앞에 점 포함)
3. 개발 서버를 완전히 종료 후 재시작
4. `.next` 폴더 삭제 후 재시작:
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

### 문제 2: "demo-api-key"가 사용됨

**원인**: 환경 변수가 로드되지 않아 기본값이 사용됨

**해결 방법**:
1. `.env.local` 파일 확인
2. 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)
3. 개발 서버 재시작

### 문제 3: Firebase 초기화 실패

**해결 방법**:
1. Firebase Console에서 프로젝트가 활성화되어 있는지 확인
2. Firebase Authentication, Firestore, Storage가 활성화되어 있는지 확인
3. `.env.local`의 설정 값이 올바른지 확인

---

## 📁 파일 구조

```
Rotape/
├── .env.local                    ← 필수! 환경 변수 파일
├── next.config.js                ← Next.js 설정
├── package.json                   ← 패키지 의존성
└── lib/
    └── firebase/
        └── config.ts             ← Firebase 초기화 파일
```

---

## 🔐 보안 주의사항

1. **`.env.local` 파일은 절대 Git에 커밋하지 마세요!**
   - `.gitignore`에 이미 포함되어 있어야 합니다
   - 이 파일에는 민감한 정보가 포함되어 있습니다

2. **프로덕션 환경**에서는:
   - Vercel, Netlify 등의 플랫폼에서 환경 변수를 직접 설정
   - `.env.production` 파일 사용 (로컬 개발용)

---

## 📝 요약

Firebase 연결에 필요한 최소 파일:

1. ✅ **`.env.local`** - Firebase 설정 정보 (가장 중요!)
2. ✅ **`lib/firebase/config.ts`** - Firebase 초기화 코드
3. ✅ **`next.config.js`** - Next.js 설정
4. ✅ **`package.json`** - Firebase 패키지 설치 확인

이 4개 파일이 올바르게 설정되어 있으면 Firebase 연결이 완료됩니다!

