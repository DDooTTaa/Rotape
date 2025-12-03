# SMS 전송 기능 설정 가이드

## 개요

Rotape 서비스에서 전화번호로 문자 메시지를 보내는 기능을 사용할 수 있습니다. 현재는 Twilio를 사용하여 구현되어 있습니다.

## Twilio 설정 방법

### 1. Twilio 계정 생성

1. [Twilio 웹사이트](https://www.twilio.com/)에 가입
2. 계정 생성 후 대시보드에서 다음 정보 확인:
   - Account SID
   - Auth Token
   - 전화번호 (Phone Number)

### 2. 환경 변수 설정

`.env.local` 파일에 다음 변수들을 추가하세요:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**참고**: 
- `TWILIO_PHONE_NUMBER`는 Twilio에서 제공받은 전화번호를 사용하세요 (예: +1234567890)
- 한국 번호로 SMS를 보내려면 Twilio에서 한국 번호를 구매하거나, 국제 SMS를 활성화해야 합니다.

## 사용 방법

### 클라이언트에서 SMS 전송

```typescript
import { sendSMS } from '@/lib/firebase/sms';

// SMS 전송
try {
  await sendSMS('010-1234-5678', '안녕하세요! 매칭이 성공했습니다.');
  console.log('SMS 전송 성공');
} catch (error) {
  console.error('SMS 전송 실패:', error);
}
```

### 서버에서 직접 호출

```typescript
// app/api/your-route/route.ts
import { sendSMS } from '@/lib/firebase/sms';

export async function POST(request: Request) {
  const { phoneNumber, message } = await request.json();
  
  try {
    await sendSMS(phoneNumber, message);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'SMS 전송 실패' }, { status: 500 });
  }
}
```

## 전화번호 형식

다음 형식들이 모두 지원됩니다:
- `010-1234-5678`
- `01012345678`
- `+821012345678`
- `821012345678`

모든 형식은 자동으로 `+821012345678` 형식으로 변환됩니다.

## 대안: 네이버 클라우드 플랫폼 SMS

한국에서 더 저렴한 SMS 서비스를 원한다면 네이버 클라우드 플랫폼 SMS를 사용할 수 있습니다. 
`app/api/sms/send/route.ts` 파일을 수정하여 네이버 클라우드 플랫폼 API를 사용하도록 변경할 수 있습니다.

## 주의사항

- Twilio는 무료 체험 계정에서 제한이 있을 수 있습니다.
- 프로덕션 환경에서는 충분한 크레딧을 확보해야 합니다.
- SMS 전송 비용이 발생할 수 있으므로 사용량을 모니터링하세요.

