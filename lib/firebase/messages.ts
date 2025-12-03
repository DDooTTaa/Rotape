import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { Message } from "./types";
import { getUser } from "./users";
import { getEvent } from "./events";
import { getApplication } from "./applications";

// Firestore Timestamp를 Date로 변환하는 헬퍼 함수
function convertTimestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
}

const messagesCollection = "messages";

// 쪽지 보내기
export async function sendMessage(
  eventId: string,
  senderId: string,
  receiverId: string,
  content: string
): Promise<string> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  
  const messageId = `${Date.now()}_${senderId}_${receiverId}`;
  const messageRef = doc(db, messagesCollection, messageId);
  
  await setDoc(messageRef, {
    eventId,
    senderId,
    receiverId,
    content,
    read: false,
    createdAt: new Date(),
  });
  
  // 수신자에게 SMS 전송
  try {
    const receiverUser = await getUser(receiverId);
    const phoneNumber = receiverUser?.phone;
    
    if (phoneNumber) {
      // 발신자 정보 가져오기
      const senderUser = await getUser(senderId);
      const senderApp = await getApplication(senderId, eventId);
      const senderNickname = senderApp?.nickname || senderUser?.name || "누군가";
      
      // 행사 정보 가져오기
      const event = await getEvent(eventId);
      const eventTitle = event?.title || "행사";
      
      // SMS 메시지 생성
      const smsMessage = `[Rotape] ${eventTitle}에서 ${senderNickname}님이 쪽지를 보냈습니다: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
      
      // SMS 전송 (동적 import로 클라이언트/서버 모두에서 작동)
      if (typeof window === 'undefined') {
        // 서버 사이드 - 직접 Twilio API 호출
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = "821012341234";
        
        if (accountSid && authToken && fromNumber) {
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
          
          // Twilio API 호출
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          const formData = new URLSearchParams();
          formData.append('From', fromNumber);
          formData.append('To', formattedPhoneNumber);
          formData.append('Body', smsMessage);
          
          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });
          
          if (!twilioResponse.ok) {
            const errorData = await twilioResponse.text();
            console.error('[쪽지 SMS] Twilio API 오류:', {
              status: twilioResponse.status,
              statusText: twilioResponse.statusText,
              errorData,
              to: formattedPhoneNumber,
            });
          } else {
            const result = await twilioResponse.json();
            console.log('[쪽지 SMS] 서버 사이드 SMS 전송 성공:', {
              messageSid: result.sid,
              to: formattedPhoneNumber,
              status: result.status,
            });
          }
        } else {
          console.error('Twilio 환경 변수가 설정되지 않았습니다.');
        }
      } else {
        // 클라이언트 사이드
        const response = await fetch('/api/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber,
            message: smsMessage,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('SMS 전송 실패:', errorText);
        }
      }
      
      console.log("쪽지 수신 SMS 전송 완료");
    }
  } catch (smsError) {
    console.error("SMS 전송 실패 (쪽지):", smsError);
    // SMS 실패해도 쪽지 전송은 성공으로 처리
  }
  
  return messageId;
}

// 쪽지 조회
export async function getMessage(messageId: string): Promise<Message | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const messageRef = doc(db, messagesCollection, messageId);
  const messageSnap = await getDoc(messageRef);
  
  if (messageSnap.exists()) {
    const data = messageSnap.data();
    return {
      messageId: messageSnap.id,
      ...data,
      createdAt: convertTimestampToDate(data.createdAt),
    } as Message;
  }
  return null;
}

// 받은 쪽지 목록 조회
export async function getReceivedMessages(receiverId: string): Promise<Message[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(
    collection(db, messagesCollection),
    where("receiverId", "==", receiverId)
  );
  const querySnapshot = await getDocs(q);
  const messages = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      messageId: doc.id,
      ...data,
      createdAt: convertTimestampToDate(data.createdAt),
    } as Message;
  });
  // 클라이언트 측에서 정렬 (인덱스 문제 방지)
  return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 보낸 쪽지 목록 조회
export async function getSentMessages(senderId: string): Promise<Message[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(
    collection(db, messagesCollection),
    where("senderId", "==", senderId)
  );
  const querySnapshot = await getDocs(q);
  const messages = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      messageId: doc.id,
      ...data,
      createdAt: convertTimestampToDate(data.createdAt),
    } as Message;
  });
  // 클라이언트 측에서 정렬 (인덱스 문제 방지)
  return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 특정 행사의 쪽지 조회 (보낸 쪽지 또는 받은 쪽지)
export async function getMessagesByEvent(eventId: string, userId: string): Promise<Message[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(
    collection(db, messagesCollection),
    where("eventId", "==", eventId)
  );
  const querySnapshot = await getDocs(q);
  const messages = querySnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        messageId: doc.id,
        ...data,
        createdAt: convertTimestampToDate(data.createdAt),
      } as Message;
    })
    .filter(msg => msg.senderId === userId || msg.receiverId === userId);
  // 클라이언트 측에서 정렬 (인덱스 문제 방지)
  return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 쪽지 읽음 처리
export async function markMessageAsRead(messageId: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const messageRef = doc(db, messagesCollection, messageId);
  await setDoc(messageRef, { read: true }, { merge: true });
}

// 특정 모임에서 보낸 쪽지 개수 조회
export async function getSentMessageCountByEvent(eventId: string, senderId: string): Promise<number> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(
    collection(db, messagesCollection),
    where("eventId", "==", eventId),
    where("senderId", "==", senderId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

