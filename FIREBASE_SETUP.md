# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `rotape`)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. 웹 앱 추가

1. Firebase 프로젝트 대시보드에서 ⚙️ 아이콘 클릭
2. "프로젝트 설정" 선택
3. "내 앱" 섹션에서 웹 아이콘 (</>) 클릭
4. 앱 닉네임 입력 (예: `Rotape Web`)
5. "앱 등록" 클릭

## 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rotape.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rotape
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rotape.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# 운영자 키
NEXT_PUBLIC_ADMIN_KEY=admin1234
```

**참고**: 위 값들은 Firebase Console의 "프로젝트 설정 > 일반" 탭에서 확인할 수 있습니다.

## 4. Firebase 서비스 활성화

### Authentication (인증)
1. Firebase Console > Authentication
2. "시작하기" 클릭
3. "Sign-in method" 탭에서 다음 제공업체 활성화:
   - **이메일/비밀번호** (필수 - 운영자 로그인용)
   - Google (활성화)
   - Apple (활성화, iOS 앱이 필요한 경우)

**중요**: 운영자 키만으로 로그인하려면 반드시 "이메일/비밀번호" 로그인을 활성화해야 합니다.

### Firestore Database
1. Firebase Console > Firestore Database
2. "데이터베이스 만들기" 클릭
3. "프로덕션 모드에서 시작" 선택 (개발 중에는 "테스트 모드"도 가능)
4. 위치 선택 (예: `asia-northeast3` - 서울)

### Storage
1. Firebase Console > Storage
2. "시작하기" 클릭
3. "프로덕션 모드에서 시작" 선택
4. 위치 선택 (Firestore와 동일한 위치 권장)

## 5. Firestore 보안 규칙 (개발용)

개발 중에는 다음 규칙을 사용할 수 있습니다 (프로덕션에서는 더 엄격한 규칙 필요):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 문서만 읽고 쓸 수 있음
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 지원서는 본인만 읽고 쓸 수 있음, 운영자는 모두 읽을 수 있음
    match /applications/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 프로필은 본인과 운영자만 읽을 수 있음
    match /profiles/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // 이벤트는 모든 인증된 사용자가 읽을 수 있음
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // 기타 컬렉션은 인증된 사용자만 접근 가능
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 6. Storage 보안 규칙 (개발용)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 프로필 사진은 본인만 업로드 가능, 모두 읽기 가능
    match /profilePhotos/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // QR 코드와 프로필 카드는 운영자만 관리
    match /qrcodes/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    match /profileCards/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## 7. 개발 서버 재시작

환경 변수를 추가한 후 개발 서버를 재시작하세요:

```bash
# 서버 중지 (Ctrl+C)
npm run dev
```

## 문제 해결

### 오류: "Firebase: Error (auth/configuration-not-found)"
- 환경 변수가 올바르게 설정되었는지 확인
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버를 재시작했는지 확인

### 오류: "Firebase: Error (auth/unauthorized-domain)"
- Firebase Console > Authentication > Settings > Authorized domains
- 현재 도메인을 추가 (예: `localhost`)

### 오류: "Missing or insufficient permissions"
- Firestore 보안 규칙 확인
- Storage 보안 규칙 확인

