import { collection, doc, setDoc, getDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./config";
import { Event } from "./types";

const eventsCollection = "events";

export async function createEvent(eventData: Omit<Event, "eventId">): Promise<string> {
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
    return { eventId, ...eventSnap.data() } as Event;
  }
  return null;
}

export async function getAllEvents(): Promise<Event[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, eventsCollection), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ eventId: doc.id, ...doc.data() } as Event));
}

