# Firebase Authorized Domains 설정 가이드

## 문제
`FirebaseError: Firebase: Error (auth/unauthorized-domain)` 에러가 발생하는 경우, Firebase Console에서 배포 도메인을 인증된 도메인 목록에 추가해야 합니다.

## 해결 방법

### 1. Vercel 배포 도메인 확인

Vercel 대시보드에서 배포된 프로젝트의 도메인을 확인하세요:
- 예: `your-project.vercel.app`
- 또는 커스텀 도메인을 사용하는 경우 해당 도메인

### 2. Firebase Console에서 도메인 추가

1. **Firebase Console 접속**
   - [https://console.firebase.google.com/](https://console.firebase.google.com/) 접속
   - 해당 프로젝트 선택

2. **Authentication 설정 열기**
   - 왼쪽 메뉴에서 **"Authentication"** 클릭
   - 상단 탭에서 **"Settings"** (또는 "설정") 클릭

3. **Authorized domains 섹션 찾기**
   - 페이지 하단으로 스크롤
   - **"Authorized domains"** (또는 "인증된 도메인") 섹션 찾기

4. **도메인 추가**
   - **"Add domain"** (또는 "도메인 추가") 버튼 클릭
   - Vercel 배포 도메인 입력:
     ```
     your-project.vercel.app
     ```
   - **"Add"** (또는 "추가") 버튼 클릭

5. **커스텀 도메인 사용 시**
   - 커스텀 도메인도 동일하게 추가:
     ```
     yourdomain.com
     www.yourdomain.com
     ```

### 3. 기본 도메인 목록

다음 도메인들은 기본적으로 포함되어 있습니다:
- `localhost` (개발용)
- `your-project.firebaseapp.com`
- `your-project.web.app`

### 4. 확인 사항

추가해야 할 도메인:
- ✅ `your-project.vercel.app` (Vercel 기본 도메인)
- ✅ 커스텀 도메인 (사용하는 경우)
- ✅ 프리뷰 배포 도메인 (필요한 경우)

### 5. 적용 시간

도메인을 추가한 후:
- 즉시 적용됩니다
- 브라우저를 새로고침하거나 캐시를 지운 후 다시 시도하세요

## 주의사항

⚠️ **보안**: Authorized domains에 추가된 도메인만 Firebase Authentication을 사용할 수 있습니다. 신뢰할 수 있는 도메인만 추가하세요.

## 문제 해결

### 여전히 에러가 발생하는 경우

1. **도메인 확인**
   - Vercel 대시보드에서 정확한 도메인 확인
   - `https://` 또는 `http://` 프로토콜 없이 도메인만 입력

2. **캐시 지우기**
   - 브라우저 캐시 및 쿠키 삭제
   - 시크릿 모드에서 테스트

3. **환경 변수 확인**
   - Vercel 환경 변수에서 `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`이 올바른지 확인
   - Firebase Console의 프로젝트 설정과 일치하는지 확인

4. **재배포**
   - Vercel에서 프로젝트를 재배포
   - 환경 변수 변경 후에는 재배포가 필요할 수 있습니다

## 예시

### Vercel 도메인 예시
```
rotape-abc123.vercel.app
rotape-git-main-yourusername.vercel.app
```

### 커스텀 도메인 예시
```
rotape.com
www.rotape.com
app.rotape.com
```

## 추가 리소스

- [Firebase 공식 문서 - Authorized Domains](https://firebase.google.com/docs/auth/web/start#set_up_authorized_domains)
- [Vercel 도메인 설정](https://vercel.com/docs/concepts/projects/domains)

