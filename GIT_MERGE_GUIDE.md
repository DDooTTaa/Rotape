# GitHub Fork에서 원본 저장소로 머지하기

현재 fork된 저장소에서 원본 저장소(ddoottaa)로 변경사항을 머지하는 방법입니다.

## 상황 확인

현재 상황:
- 원본 저장소: `ddoottaa/rotape` (또는 `ddoottaa/저장소명`)
- Fork된 저장소: `your-username/rotape`
- 원본 저장소에 직접 push 권한이 없는 상태

## 해결 방법

### 방법 1: Pull Request를 통한 머지 (권장)

1. **Fork된 저장소에 코드 푸시**
   ```bash
   git add .
   git commit -m "변경사항 설명"
   git push origin main
   ```

2. **GitHub에서 Pull Request 생성**
   - Fork된 저장소 페이지로 이동
   - "Contribute" → "Open pull request" 클릭
   - 원본 저장소(`ddoottaa/rotape`)로 PR 생성
   - PR 제목과 설명 작성
   - "Create pull request" 클릭

3. **원본 저장소 관리자가 머지**
   - `ddoottaa` 계정으로 로그인
   - PR 페이지에서 "Merge pull request" 클릭

### 방법 2: 원본 저장소에 직접 Push 권한이 있는 경우

원본 저장소에 직접 push 권한이 있다면 remote를 변경할 수 있습니다.

1. **현재 remote 확인**
   ```bash
   git remote -v
   ```

2. **원본 저장소로 remote 변경**
   ```bash
   # 기존 origin 제거 (또는 upstream으로 변경)
   git remote set-url origin https://github.com/ddoottaa/rotape.git
   
   # 또는 fork된 저장소를 upstream으로 추가
   git remote add upstream https://github.com/ddoottaa/rotape.git
   git remote set-url origin https://github.com/your-username/rotape.git
   ```

3. **원본 저장소로 직접 push**
   ```bash
   git push origin main
   # 또는
   git push upstream main
   ```

### 방법 3: 원본 저장소를 upstream으로 설정

Fork된 저장소를 유지하면서 원본 저장소를 upstream으로 설정:

1. **Upstream 추가**
   ```bash
   git remote add upstream https://github.com/ddoottaa/rotape.git
   ```

2. **Upstream에서 최신 변경사항 가져오기**
   ```bash
   git fetch upstream
   git merge upstream/main
   ```

3. **변경사항을 fork된 저장소에 push**
   ```bash
   git push origin main
   ```

4. **Pull Request 생성** (방법 1 참고)

## 현재 저장소 설정 확인 및 변경

### 1. 현재 remote 확인
```bash
git remote -v
```

출력 예시:
```
origin  https://github.com/your-username/rotape.git (fetch)
origin  https://github.com/your-username/rotape.git (push)
```

### 2. 원본 저장소로 remote 변경 (직접 push 권한이 있는 경우)
```bash
git remote set-url origin https://github.com/ddoottaa/rotape.git
```

### 3. 원본 저장소를 upstream으로 추가 (fork 유지)
```bash
git remote add upstream https://github.com/ddoottaa/rotape.git
```

## 권장 워크플로우

1. **Fork된 저장소에서 작업**
   ```bash
   git checkout -b feature/new-feature
   # 코드 수정
   git add .
   git commit -m "새 기능 추가"
   git push origin feature/new-feature
   ```

2. **Pull Request 생성**
   - GitHub에서 PR 생성
   - 원본 저장소로 PR 보내기

3. **원본 저장소 관리자가 리뷰 후 머지**

## 문제 해결

### "Permission denied" 에러
- 원본 저장소에 직접 push 권한이 없는 경우
- Pull Request를 사용하세요

### "Remote already exists" 에러
```bash
git remote remove upstream
git remote add upstream https://github.com/ddoottaa/rotape.git
```

### Fork된 저장소와 원본 저장소 동기화
```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## 참고

- 원본 저장소에 직접 push 권한이 없다면 Pull Request를 사용해야 합니다
- Fork된 저장소는 본인의 저장소이므로 자유롭게 push할 수 있습니다
- 원본 저장소 관리자가 PR을 머지하면 변경사항이 반영됩니다

