# 빠른 시작 가이드

## Firebase 설정 (5분 안에 완료)

### 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `rotape`)
4. Google Analytics는 선택사항
5. 프로젝트 생성 완료

### 2단계: 웹 앱 추가

1. Firebase 프로젝트 대시보드에서 ⚙️ 아이콘 클릭
2. "프로젝트 설정" 선택
3. "내 앱" 섹션에서 웹 아이콘 (</>) 클릭
4. 앱 닉네임 입력 (예: `Rotape Web`)
5. "앱 등록" 클릭

### 3단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고, Firebase Console에서 복사한 설정 값을 붙여넣으세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=여기에_API_KEY_붙여넣기
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=여기에_AUTH_DOMAIN_붙여넣기
NEXT_PUBLIC_FIREBASE_PROJECT_ID=여기에_PROJECT_ID_붙여넣기
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=여기에_STORAGE_BUCKET_붙여넣기
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=여기에_SENDER_ID_붙여넣기
NEXT_PUBLIC_FIREBASE_APP_ID=여기에_APP_ID_붙여넣기

NEXT_PUBLIC_ADMIN_KEY=admin1234
```

**위 값들은 Firebase Console의 "프로젝트 설정 > 일반" 탭에서 확인할 수 있습니다.**

### 4단계: Firebase 서비스 활성화

#### Authentication (인증)
1. Firebase Console > Authentication
2. "시작하기" 클릭
3. "Sign-in method" 탭에서:
   - **이메일/비밀번호** 활성화 (운영자 로그인용)
   - Google 활성화 (선택사항)
   - Apple 활성화 (선택사항)

#### Firestore Database
1. Firebase Console > Firestore Database
2. "데이터베이스 만들기" 클릭
3. "테스트 모드에서 시작" 선택 (개발용)
4. 위치 선택 (예: `asia-northeast3` - 서울)

#### Storage
1. Firebase Console > Storage
2. "시작하기" 클릭
3. "테스트 모드에서 시작" 선택 (개발용)
4. 위치 선택 (Firestore와 동일한 위치 권장)

### 5단계: 개발 서버 재시작

```bash
# 서버 중지 (Ctrl+C)
npm run dev
```

### 완료!

이제 운영자 키(`admin1234`)로 로그인할 수 있습니다.

## 문제 해결

### "인증 서비스를 사용할 수 없습니다" 오류

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 값이 올바른지 확인 (따옴표 없이)
3. 개발 서버를 재시작했는지 확인
4. 브라우저 콘솔(F12)에서 오류 메시지 확인

### Firebase 초기화 오류

- 브라우저 콘솔에서 정확한 오류 메시지 확인
- Firebase Console에서 프로젝트가 활성화되어 있는지 확인
- 환경 변수에 공백이나 특수문자가 없는지 확인

