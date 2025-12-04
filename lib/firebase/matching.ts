import { collection, doc, setDoc, getDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./config";
import { Like, Match, VoteResult } from "./types";

const likesCollection = "likes";
const matchesCollection = "matches";
const voteResultsCollection = "voteResults";

export async function submitLike(uid: string, eventId: string, likeData: Omit<Like, "uid" | "eventId" | "createdAt">): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const likeRef = doc(db, likesCollection, `${uid}_${eventId}`);
  await setDoc(likeRef, {
    ...likeData,
    uid,
    eventId,
    createdAt: new Date(),
  });
  
  // 투표 결과 업데이트
  await updateVoteResult(eventId);
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

// 이벤트별 투표 결과 업데이트
export async function updateVoteResult(eventId: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  
  // 해당 이벤트의 모든 투표 가져오기
  const likes = await getAllLikesForEvent(eventId);
  
  // 투표 결과 집계
  const voteCounts: VoteResult["voteCounts"] = {};
  
  for (const like of likes) {
    // 1순위 투표
    if (like.first) {
      if (!voteCounts[like.first]) {
        voteCounts[like.first] = { first: 0, second: 0, third: 0, totalScore: 0 };
      }
      voteCounts[like.first].first += 1;
      voteCounts[like.first].totalScore += 3;
    }
    
    // 2순위 투표
    if (like.second) {
      if (!voteCounts[like.second]) {
        voteCounts[like.second] = { first: 0, second: 0, third: 0, totalScore: 0 };
      }
      voteCounts[like.second].second += 1;
      voteCounts[like.second].totalScore += 2;
    }
    
    // 3순위 투표
    if (like.third) {
      if (!voteCounts[like.third]) {
        voteCounts[like.third] = { first: 0, second: 0, third: 0, totalScore: 0 };
      }
      voteCounts[like.third].third += 1;
      voteCounts[like.third].totalScore += 1;
    }
  }
  
  // 투표 결과 저장
  const voteResultRef = doc(db, voteResultsCollection, eventId);
  await setDoc(voteResultRef, {
    eventId,
    voteCounts,
    totalVotes: likes.length,
    updatedAt: Timestamp.now(),
  }, { merge: false });
}

// 이벤트별 투표 결과 가져오기
export async function getVoteResult(eventId: string): Promise<VoteResult | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const voteResultRef = doc(db, voteResultsCollection, eventId);
  const voteResultSnap = await getDoc(voteResultRef);
  
  if (voteResultSnap.exists()) {
    const data = voteResultSnap.data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as VoteResult;
  }
  return null;
}

