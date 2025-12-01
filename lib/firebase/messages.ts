import { collection, doc, setDoc, getDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "./config";
import { Message } from "./types";

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
    where("receiverId", "==", receiverId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      messageId: doc.id,
      ...data,
      createdAt: convertTimestampToDate(data.createdAt),
    } as Message;
  });
}

// 보낸 쪽지 목록 조회
export async function getSentMessages(senderId: string): Promise<Message[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(
    collection(db, messagesCollection),
    where("senderId", "==", senderId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      messageId: doc.id,
      ...data,
      createdAt: convertTimestampToDate(data.createdAt),
    } as Message;
  });
}

// 특정 행사의 쪽지 조회 (보낸 쪽지 또는 받은 쪽지)
export async function getMessagesByEvent(eventId: string, userId: string): Promise<Message[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(
    collection(db, messagesCollection),
    where("eventId", "==", eventId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        messageId: doc.id,
        ...data,
        createdAt: convertTimestampToDate(data.createdAt),
      } as Message;
    })
    .filter(msg => msg.senderId === userId || msg.receiverId === userId);
}

// 쪽지 읽음 처리
export async function markMessageAsRead(messageId: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const messageRef = doc(db, messagesCollection, messageId);
  await setDoc(messageRef, { read: true }, { merge: true });
}

