import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "./config";
import { Event } from "./types";

const eventsCollection = "events";

// Firestore Timestamp를 Date로 변환하는 헬퍼 함수
function convertTimestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return new Date();
}

export async function createEvent(eventData: Omit<Event, "eventId">): Promise<string> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const eventRef = doc(collection(db, eventsCollection));
  await setDoc(eventRef, {
    ...eventData,
    createdAt: new Date(),
  });
  return eventRef.id;
}

export async function getEvent(eventId: string): Promise<Event | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const eventRef = doc(db, eventsCollection, eventId);
  const eventSnap = await getDoc(eventRef);
  
  if (eventSnap.exists()) {
    const data = eventSnap.data();
    return {
      eventId,
      ...data,
      date: convertTimestampToDate(data.date),
      createdAt: convertTimestampToDate(data.createdAt),
    } as Event;
  }
  return null;
}

export async function getAllEvents(): Promise<Event[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, eventsCollection), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      eventId: doc.id,
      ...data,
      date: convertTimestampToDate(data.date),
      createdAt: convertTimestampToDate(data.createdAt),
    } as Event;
  });
}

