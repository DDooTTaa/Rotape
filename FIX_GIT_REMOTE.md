# Git Remote 설정 변경 가이드

현재 설정:
- **origin**: `https://github.com/sonyong4013/Rotape.git` (fork된 저장소)
- **upstream**: `https://github.com/DDooTTaa/Rotape.git` (원본 저장소)

## 원본 저장소에 직접 Push하고 싶은 경우

### 방법 1: Origin을 원본 저장소로 변경 (권장)

원본 저장소(`DDooTTaa`)에 직접 push 권한이 있다면:

```bash
# origin을 원본 저장소로 변경
git remote set-url origin https://github.com/DDooTTaa/Rotape.git

# 확인
git remote -v
```

이제 `git push origin main`을 하면 원본 저장소에 직접 push됩니다.

### 방법 2: Pull Request 사용 (권한이 없는 경우)

원본 저장소에 직접 push 권한이 없다면:

1. **Fork된 저장소에 push**
   ```bash
   git push origin main
   ```

2. **GitHub에서 Pull Request 생성**
   - `https://github.com/sonyong4013/Rotape` 접속
   - "Contribute" → "Open pull request" 클릭
   - 원본 저장소(`DDooTTaa/Rotape`)로 PR 생성

## 현재 상태 확인

```bash
git remote -v
```

## 원본 저장소로 직접 Push

```bash
# 변경사항 커밋
git add .
git commit -m "변경사항 설명"

# 원본 저장소로 push
git push origin main
```

## 주의사항

- 원본 저장소에 직접 push하려면 해당 저장소에 대한 **write 권한**이 필요합니다
- 권한이 없다면 Pull Request를 사용해야 합니다
- 원본 저장소 관리자(`DDooTTaa`)에게 권한을 요청하거나 PR을 통해 머지 요청하세요

