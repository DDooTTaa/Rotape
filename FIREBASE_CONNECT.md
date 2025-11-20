# Firebase 연결 가이드

## 🚀 빠른 시작 (5분)

### 1단계: Firebase 프로젝트 생성

1. **Firebase Console 접속**
   - https://console.firebase.google.com/ 접속
   - Google 계정으로 로그인

2. **프로젝트 추가**
   - "프로젝트 추가" 또는 "Add project" 클릭
   - 프로젝트 이름 입력 (예: `rotape` 또는 원하는 이름)
   - Google Analytics 설정 (선택사항, 처음에는 건너뛰어도 됨)
   - "프로젝트 만들기" 클릭

3. **프로젝트 생성 완료 대기**
   - 몇 초 정도 소요됩니다

### 2단계: 웹 앱 추가

1. **프로젝트 대시보드에서**
   - ⚙️ 아이콘 (프로젝트 설정) 클릭
   - 또는 "프로젝트 설정" 메뉴 선택

2. **웹 앱 추가**
   - "내 앱" 섹션에서 웹 아이콘 (</>) 클릭
   - 앱 닉네임 입력 (예: `Rotape Web`)
   - Firebase Hosting 설정은 나중에 해도 됨
   - "앱 등록" 클릭

3. **설정 값 복사**
   - 아래와 같은 설정 값들이 표시됩니다:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

### 3단계: 환경 변수 파일 생성

1. **프로젝트 루트에 `.env.local` 파일 생성**
   - `.env.local.template` 파일을 복사하거나
   - 새 파일을 만들어서 아래 내용 추가

2. **Firebase Console에서 복사한 값 붙여넣기**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy... (여기에 실제 값)
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

   NEXT_PUBLIC_ADMIN_KEY=admin1234
   NEXT_PUBLIC_ADMIN_EMAIL=admin@rotape.com
   ```

   **⚠️ 중요**: 
   - 따옴표(`"`) 없이 값만 입력
   - 공백 없이 `=` 뒤에 바로 값 입력
   - 주석(`#`)은 무시됩니다

### 4단계: Firebase 서비스 활성화

#### 🔐 Authentication (인증) - 필수

1. Firebase Console > **Authentication**
2. "시작하기" 또는 "Get started" 클릭
3. **Sign-in method** 탭 클릭
4. 다음 제공업체 활성화:
   - **이메일/비밀번호** (Email/Password) - **필수!**
     - 클릭 > 사용 설정 > 저장
   - Google (선택사항)
     - 클릭 > 사용 설정 > 프로젝트 지원 이메일 선택 > 저장
   - Apple (선택사항)

#### 💾 Firestore Database - 필수

1. Firebase Console > **Firestore Database**
2. "데이터베이스 만들기" 또는 "Create database" 클릭
3. **테스트 모드에서 시작** 선택 (개발용)
   - 프로덕션 모드는 나중에 설정 가능
4. 위치 선택:
   - `asia-northeast3` (서울) 권장
   - 또는 가장 가까운 지역 선택
5. "사용 설정" 클릭

#### 📦 Storage - 필수

1. Firebase Console > **Storage**
2. "시작하기" 또는 "Get started" 클릭
3. **테스트 모드에서 시작** 선택
4. 위치 선택 (Firestore와 동일한 위치 권장)
5. "완료" 클릭

### 5단계: 개발 서버 재시작

```bash
# 현재 실행 중인 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
npm run dev
```

### 6단계: 연결 확인

1. 브라우저에서 http://localhost:3000 접속
2. 메인 페이지에서 Firebase 설정 안내 배너가 사라졌는지 확인
3. 운영자 모드 선택 후 운영자 키(`admin1234`)로 로그인 시도
4. 브라우저 콘솔(F12)에서 오류가 없는지 확인

## ✅ 연결 완료 체크리스트

- [ ] Firebase 프로젝트 생성 완료
- [ ] 웹 앱 추가 완료
- [ ] `.env.local` 파일 생성 및 설정 값 입력
- [ ] Authentication > 이메일/비밀번호 활성화
- [ ] Firestore Database 생성 완료
- [ ] Storage 활성화 완료
- [ ] 개발 서버 재시작 완료
- [ ] 메인 페이지에서 로그인 가능한지 확인

## 🐛 문제 해결

### "인증 서비스를 사용할 수 없습니다" 오류

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 값에 따옴표나 공백이 없는지 확인
3. 개발 서버를 재시작했는지 확인
4. 브라우저 콘솔(F12)에서 오류 메시지 확인

### Firebase 초기화 오류

- 환경 변수 값이 올바른지 확인
- Firebase Console에서 프로젝트가 활성화되어 있는지 확인
- `NEXT_PUBLIC_` 접두사가 모든 변수에 있는지 확인

### 로그인 오류

- Authentication > 이메일/비밀번호가 활성화되어 있는지 확인
- 운영자 키가 올바른지 확인 (기본값: `admin1234`)

## 📚 추가 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Next.js + Firebase 가이드](https://firebase.google.com/docs/web/setup)
- 프로젝트의 `FIREBASE_SETUP.md` 파일 참고

