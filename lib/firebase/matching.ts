import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { Like, Match } from "./types";

const likesCollection = "likes";
const matchesCollection = "matches";

export async function submitLike(uid: string, eventId: string, likeData: Omit<Like, "uid" | "eventId" | "createdAt">): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const likeRef = doc(db, likesCollection, `${uid}_${eventId}`);
  await setDoc(likeRef, {
    ...likeData,
    uid,
    eventId,
    createdAt: new Date(),
  });
}

export async function getLike(uid: string, eventId: string): Promise<Like | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const likeRef = doc(db, likesCollection, `${uid}_${eventId}`);
  const likeSnap = await getDoc(likeRef);
  
  if (likeSnap.exists()) {
    return likeSnap.data() as Like;
  }
  return null;
}

export async function getAllLikesForEvent(eventId: string): Promise<Like[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, likesCollection), where("eventId", "==", eventId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Like);
}

export async function createMatch(eventId: string, matchData: Omit<Match, "eventId" | "createdAt">): Promise<string> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const matchRef = doc(collection(db, matchesCollection));
  await setDoc(matchRef, {
    ...matchData,
    eventId,
    createdAt: new Date(),
  });
  return matchRef.id;
}

export async function getMatchesForEvent(eventId: string): Promise<Match[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, matchesCollection), where("eventId", "==", eventId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Match);
}

// 매칭 알고리즘: 상호 선택을 기반으로 매칭
export function calculateMatches(likes: Like[]): Match[] {
  const matches: Match[] = [];
  const processed = new Set<string>();

  for (const like of likes) {
    if (processed.has(like.uid)) continue;

    // 1순위 선택 확인
    const targetLike = likes.find(l => l.uid === like.first && l.first === like.uid);
    if (targetLike) {
      matches.push({
        eventId: like.eventId,
        userA: like.uid,
        userB: like.first,
        score: 10, // 상호 1순위
        createdAt: new Date(),
      });
      processed.add(like.uid);
      processed.add(like.first);
      continue;
    }

    // 2순위 선택 확인
    const targetLike2 = likes.find(l => l.uid === like.second && (l.first === like.uid || l.second === like.uid));
    if (targetLike2) {
      matches.push({
        eventId: like.eventId,
        userA: like.uid,
        userB: like.second,
        score: 7, // 상호 2순위
        createdAt: new Date(),
      });
      processed.add(like.uid);
      processed.add(like.second);
      continue;
    }

    // 3순위 선택 확인
    const targetLike3 = likes.find(l => l.uid === like.third && (l.first === like.uid || l.second === like.uid || l.third === like.uid));
    if (targetLike3) {
      matches.push({
        eventId: like.eventId,
        userA: like.uid,
        userB: like.third,
        score: 5, // 상호 3순위
        createdAt: new Date(),
      });
      processed.add(like.uid);
      processed.add(like.third);
    }
  }

  return matches;
}

