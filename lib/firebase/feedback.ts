import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { Feedback } from "./types";

const feedbackCollection = "feedback";

export async function submitFeedback(feedbackData: Omit<Feedback, "createdAt">): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const feedbackRef = doc(db, feedbackCollection, `${feedbackData.eventId}_${feedbackData.uid}`);
  await setDoc(feedbackRef, {
    ...feedbackData,
    createdAt: new Date(),
  });
}

export async function getFeedback(eventId: string, uid: string): Promise<Feedback | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const feedbackRef = doc(db, feedbackCollection, `${eventId}_${uid}`);
  const feedbackSnap = await getDoc(feedbackRef);
  
  if (feedbackSnap.exists()) {
    return feedbackSnap.data() as Feedback;
  }
  return null;
}

export async function getAllFeedbackForEvent(eventId: string): Promise<Feedback[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, feedbackCollection), where("eventId", "==", eventId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Feedback);
}

