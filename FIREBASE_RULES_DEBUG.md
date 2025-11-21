# Firestore 규칙 디버깅 가이드

## 현재 오류
- `permission-denied`: Firestore 보안 규칙에서 접근이 거부됨
- `getUser` 함수에서 발생

## 해결 방법

### 1. Firestore 규칙 확인 및 수정

Firebase Console → Firestore Database → 규칙 탭에서 아래 규칙을 **정확히** 입력:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 모든 컬렉션에 대해 인증된 사용자만 접근 허용
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**중요**: 
- 규칙 입력 후 반드시 **"게시"** 버튼 클릭
- 규칙 탭 상단에 "게시됨" 표시 확인

### 2. 임시 완전 개방 규칙 (개발 테스트용)

만약 위 규칙도 작동하지 않는다면, 임시로 아래 규칙으로 테스트:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ 경고**: 이 규칙은 모든 사용자에게 모든 권한을 허용합니다. 
개발 테스트용으로만 사용하고, 테스트 후 반드시 `request.auth != null` 규칙으로 되돌리세요.

### 3. Firestore 데이터베이스 모드 확인

Firebase Console → Firestore Database → 데이터 탭에서:
- 데이터베이스가 "테스트 모드"인지 확인
- 또는 "프로덕션 모드"라면 규칙이 제대로 설정되어 있는지 확인

### 4. 인증 상태 확인

브라우저 콘솔(F12)에서 다음을 실행하여 인증 상태 확인:

```javascript
// Firebase가 전역에 노출되어 있다면
firebase.auth().currentUser
```

또는 코드에서 로그인 후 인증 상태를 확인하도록 수정 필요할 수 있습니다.

## 체크리스트

- [ ] Firestore 데이터베이스가 생성되어 있음
- [ ] Firestore 규칙이 정확히 입력되어 있음
- [ ] 규칙이 "게시"되어 있음
- [ ] 로그인은 성공했지만 Firestore 접근이 실패함
- [ ] 브라우저 콘솔에서 `permission-denied` 오류 확인

## 다음 단계

1. 위 규칙을 정확히 입력하고 게시
2. 브라우저 새로고침 (Ctrl+Shift+R)
3. 다시 로그인 시도
4. 여전히 실패하면 임시 완전 개방 규칙으로 테스트

