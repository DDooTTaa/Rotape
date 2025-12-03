// SMS 전송 함수
export async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'SMS 전송에 실패했습니다.');
    }

    const data = await response.json();
    console.log('SMS 전송 성공:', data);
  } catch (error) {
    console.error('SMS 전송 실패:', error);
    throw error;
  }
}

