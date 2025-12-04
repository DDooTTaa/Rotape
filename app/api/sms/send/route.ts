import { NextRequest, NextResponse } from 'next/server';
import { SolapiMessageService } from 'solapi';

// 환경 변수에서 API 키 가져오기
const apiKey = process.env.SOLAPI_API_KEY || '';
const apiSecret = process.env.SOLAPI_API_SECRET || '';
// 문자 발송 기능 활성화 여부 (기본값: false, 비활성화)
const smsEnabled = false;

export async function POST(request: NextRequest) {
  try {
    // 문자 발송 기능이 비활성화되어 있으면 바로 반환
    if (!smsEnabled) {
      console.log('문자 발송 기능이 비활성화되어 있습니다. (SOLAPI_ENABLED=false)');
      return NextResponse.json({
        success: true,
        data: { disabled: true, message: '문자 발송 기능이 비활성화되어 있습니다.' },
      });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { to, text, from } = body;

    // 필수 파라미터 검증
    if (!to || !text) {
      return NextResponse.json(
        { error: '수신번호(to)와 메시지 내용(text)은 필수입니다.' },
        { status: 400 }
      );
    }

    // API 키 검증
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'SOLAPI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // SOLAPI 메시지 서비스 초기화
    const messageService = new SolapiMessageService(apiKey, apiSecret);

    // 메시지 구성
    const message = {
      text: text,
      to: to,
      from: from || process.env.SOLAPI_DEFAULT_FROM || '01089811131', // 기본 발신번호
    };

    // 메시지 그룹 생성
    const messageGroup = [message];

    // 메시지 발송 (send 메서드 사용)
    const result = await messageService.send(messageGroup);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('문자 발송 오류:', error);
    return NextResponse.json(
      {
        error: '문자 발송 중 오류가 발생했습니다.',
        details: error.message || '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

