/**
 * SOLAPI 문자 발송 사용 예제
 * 
 * 이 파일은 참고용 예제입니다. 실제 사용 시에는 이 파일을 삭제하거나
 * 프로젝트에서 import하지 않도록 주의하세요.
 */

import { sendSMS, sendSMSToMany } from './sms';

// 예제 1: 단일 수신자에게 문자 발송
export async function exampleSendSingleSMS() {
  const result = await sendSMS({
    to: '01089811131',
    text: '[Rotape] 안녕하세요! 행사 참가가 승인되었습니다.',
    from: '01089811131', // 선택사항, 기본값 사용 가능
  });

  if (result.success) {
    console.log('문자 발송 성공:', result.data);
  } else {
    console.error('문자 발송 실패:', result.error);
  }
}

// 예제 2: 여러 수신자에게 동일한 문자 발송
export async function exampleSendMultipleSMS() {
  const recipients = [
    '01089811131',
    '01012345678',
    '01087654321',
  ];

  const results = await sendSMSToMany(
    recipients,
    '[Rotape] 행사 일정이 변경되었습니다. 확인해주세요.',
    '01089811131' // 선택사항
  );

  // 결과 확인
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`${recipients[index]} 발송 성공`);
    } else {
      console.error(`${recipients[index]} 발송 실패:`, result.error);
    }
  });
}

// 예제 3: React 컴포넌트에서 사용
/*
import { useState } from 'react';
import { sendSMS } from '@/lib/utils/sms';

export function MyComponent() {
  const [loading, setLoading] = useState(false);

  const handleSendSMS = async () => {
    setLoading(true);
    try {
      const result = await sendSMS({
        to: '01089811131',
        text: '[Rotape] 테스트 메시지입니다.',
      });

      if (result.success) {
        alert('문자가 발송되었습니다!');
      } else {
        alert(`발송 실패: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleSendSMS} disabled={loading}>
      {loading ? '발송 중...' : '문자 발송'}
    </button>
  );
}
*/

// 예제 4: API 라우트에서 직접 사용 (서버 사이드)
/*
import { NextRequest, NextResponse } from 'next/server';
import { SolapiMessageService } from 'solapi';

export async function POST(request: NextRequest) {
  const apiKey = process.env.SOLAPI_API_KEY!;
  const apiSecret = process.env.SOLAPI_API_SECRET!;
  
  const messageService = new SolapiMessageService(apiKey, apiSecret);
  
  const message = {
    text: '[Rotape] 서버에서 직접 발송',
    to: '01089811131',
    from: '01089811131',
  };

  // send 메서드 사용 (배열로 전달)
  const result = await messageService.send([message]);
  
  return NextResponse.json({ success: true, data: result });
}
*/

