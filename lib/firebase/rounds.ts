import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { Round } from "./types";

const roundsCollection = "rounds";

export async function createRound(roundData: Round): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const roundRef = doc(db, roundsCollection, `${roundData.eventId}_${roundData.roundNumber}`);
  await setDoc(roundRef, {
    ...roundData,
    startTime: new Date(),
  });
}

export async function getRound(eventId: string, roundNumber: number): Promise<Round | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const roundRef = doc(db, roundsCollection, `${eventId}_${roundNumber}`);
  const roundSnap = await getDoc(roundRef);
  
  if (roundSnap.exists()) {
    return roundSnap.data() as Round;
  }
  return null;
}

export async function getRoundsByEvent(eventId: string): Promise<Round[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, roundsCollection), where("eventId", "==", eventId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Round);
}

export async function endRound(eventId: string, roundNumber: number): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const roundRef = doc(db, roundsCollection, `${eventId}_${roundNumber}`);
  await setDoc(roundRef, { endTime: new Date() }, { merge: true });
}

