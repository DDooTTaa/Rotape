/**
 * SOLAPI 문자 발송 유틸리티 함수
 */

export interface SendSMSOptions {
  to: string; // 수신번호
  text: string; // 메시지 내용
  from?: string; // 발신번호 (선택사항)
}

export interface SendSMSResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

/**
 * 문자 발송 함수
 * @param options 문자 발송 옵션
 * @returns 발송 결과
 */
export async function sendSMS(options: SendSMSOptions): Promise<SendSMSResponse> {
  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.to,
        text: options.text,
        from: options.from,
      }),
    });

    const data = await response.json();

    // 문자 발송 기능이 비활성화된 경우
    if (data.data?.disabled) {
      console.log('문자 발송 기능이 비활성화되어 있습니다.');
      return {
        success: true,
        data: data.data,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '문자 발송에 실패했습니다.',
        details: data.details,
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error('문자 발송 오류:', error);
    return {
      success: false,
      error: '문자 발송 중 오류가 발생했습니다.',
      details: error.message || '알 수 없는 오류',
    };
  }
}

/**
 * 여러 수신자에게 문자 발송
 * @param recipients 수신자 목록
 * @param text 메시지 내용
 * @param from 발신번호 (선택사항)
 * @returns 발송 결과 배열
 */
export async function sendSMSToMany(
  recipients: string[],
  text: string,
  from?: string
): Promise<SendSMSResponse[]> {
  const results = await Promise.all(
    recipients.map((to) => sendSMS({ to, text, from }))
  );
  return results;
}

