import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    console.log('[SMS API] 요청 받음:', { phoneNumber, messageLength: message?.length });

    if (!phoneNumber || !message) {
      console.error('[SMS API] 필수 파라미터 누락:', { phoneNumber: !!phoneNumber, message: !!message });
      return NextResponse.json(
        { error: '전화번호와 메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 전화번호를 +82 형식으로 변환
    const formatPhoneNumber = (phone: string): string => {
      // 하이픈, 공백, 괄호 제거
      const clean = phone.replace(/[-\s()]/g, '');
      
      // 이미 +82 형식이면 그대로 반환
      if (clean.startsWith('+82')) {
        return clean;
      }
      
      // +82로 시작하지만 숫자가 아닌 경우 처리
      if (clean.startsWith('82') && clean.length >= 11) {
        return `+${clean}`;
      }
      
      // 010, 011, 016, 017, 018, 019로 시작하는 경우
      if (clean.match(/^01[0-9]/)) {
        return `+82${clean.substring(1)}`;
      }
      
      // 02로 시작하는 경우 (서울 지역번호)
      if (clean.startsWith('02')) {
        return `+82${clean}`;
      }
      
      // 이미 +로 시작하는 경우 (다른 국가 코드)
      if (clean.startsWith('+')) {
        return clean;
      }
      
      // 그 외의 경우 +82 추가
      return `+82${clean}`;
    };
    
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    console.log('[SMS API] 전화번호 변환:', { 원본: phoneNumber, 변환: formattedPhoneNumber });

    // Twilio 사용 (환경 변수에서 설정)
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log('[SMS API] 환경 변수 확인:', {
      accountSid: accountSid ? `${accountSid.substring(0, 4)}...` : '없음',
      authToken: authToken ? '설정됨' : '없음',
      fromNumber: fromNumber || '없음',
    });

    if (!accountSid || !authToken || !fromNumber) {
      console.error('[SMS API] Twilio 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'SMS 서비스가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // From과 To 번호가 같은지 확인
    const fromFormatted = formatPhoneNumber(fromNumber);
    if (formattedPhoneNumber === fromFormatted) {
      console.error('[SMS API] From과 To 번호가 동일합니다:', formattedPhoneNumber);
      return NextResponse.json(
        { error: '발신 번호와 수신 번호가 동일합니다. 다른 번호로 시도해주세요.' },
        { status: 400 }
      );
    }

    // Twilio API 호출
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('From', fromNumber);
    formData.append('To', formattedPhoneNumber);
    formData.append('Body', message);

    console.log('[SMS API] Twilio API 호출 시작:', {
      url: twilioUrl,
      from: fromNumber,
      to: formattedPhoneNumber,
      messageLength: message.length,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    console.log('[SMS API] Twilio 응답 상태:', twilioResponse.status, twilioResponse.statusText);

    if (!twilioResponse.ok) {
      const errorData = await twilioResponse.text();
      console.error('[SMS API] Twilio API 오류:', {
        status: twilioResponse.status,
        statusText: twilioResponse.statusText,
        errorData,
      });
      
      // Twilio 에러 메시지 파싱 시도
      let errorMessage = `Twilio API 오류: ${twilioResponse.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        // JSON 파싱 실패 시 원본 텍스트 사용
        errorMessage = errorData.substring(0, 200);
      }
      
      return NextResponse.json(
        { error: errorMessage, details: errorData },
        { status: twilioResponse.status }
      );
    }

    const result = await twilioResponse.json();
    console.log('[SMS API] SMS 전송 성공:', {
      messageSid: result.sid,
      to: formattedPhoneNumber,
      status: result.status,
    });
    
    return NextResponse.json({
      success: true,
      messageSid: result.sid,
      to: formattedPhoneNumber,
      status: result.status,
    });
  } catch (error: any) {
    console.error('[SMS API] 예외 발생:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { error: error.message || 'SMS 전송에 실패했습니다.', details: error.stack },
      { status: 500 }
    );
  }
}

