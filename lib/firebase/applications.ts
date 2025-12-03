import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./config";
import { Application, ApplicationStatus } from "./types";

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

const applicationsCollection = "applications";

export async function createApplication(uid: string, applicationData: Omit<Application, "uid" | "status" | "createdAt">, eventId?: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  
  try {
    // eventId가 있으면 {uid}_{eventId} 형태로, 없으면 uid만 사용
    const docId = eventId ? `${uid}_${eventId}` : uid;
    const applicationRef = doc(db, applicationsCollection, docId);
    
    // Firestore는 undefined 값을 저장할 수 없으므로, eventId가 있을 때만 포함
    const applicationDoc: any = {
      uid, // uid 필드를 명시적으로 저장
      ...applicationData,
      status: "pending" as ApplicationStatus,
      createdAt: new Date(),
    };
    
    // eventId가 있을 때만 필드에 추가 (undefined를 저장하지 않음)
    if (eventId) {
      applicationDoc.eventId = eventId;
    }
    
    await setDoc(applicationRef, applicationDoc, { merge: false }); // merge: false로 명시적으로 새 문서 생성
    
    console.log("지원서 생성 성공:", docId);
  } catch (error: any) {
    console.error("createApplication 오류:", error);
    console.error("오류 코드:", error?.code);
    console.error("오류 메시지:", error?.message);
    throw error;
  }
}

export async function getApplication(uid: string, eventId?: string): Promise<Application | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  // eventId가 있으면 {uid}_{eventId} 형태로, 없으면 uid만 사용
  const docId = eventId ? `${uid}_${eventId}` : uid;
  const applicationRef = doc(db, applicationsCollection, docId);
  const applicationSnap = await getDoc(applicationRef);
  
  if (applicationSnap.exists()) {
    const data = applicationSnap.data();
    return { 
      uid, 
      ...data,
      createdAt: convertTimestampToDate(data.createdAt)
    } as Application;
  }
  return null;
}

// 행사별 지원서 조회
export async function getApplicationByEvent(uid: string, eventId: string): Promise<Application | null> {
  return getApplication(uid, eventId);
}

// 사용자의 모든 지원서 조회
export async function getUserApplications(uid: string): Promise<Application[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, applicationsCollection), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  const applications = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      uid: data.uid || doc.id.split('_')[0], // uid가 없으면 docId에서 추출
      ...data,
      createdAt: convertTimestampToDate(data.createdAt)
    } as Application;
  });
  return applications;
}

export async function updateApplicationStatus(docId: string, status: ApplicationStatus): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const applicationRef = doc(db, applicationsCollection, docId);
  const docSnap = await getDoc(applicationRef);
  
  if (!docSnap.exists()) {
    throw new Error(`문서를 찾을 수 없습니다: ${docId}`);
  }
  
  await updateDoc(applicationRef, { status });
}

// 닉네임 할당 함수
export async function assignNickname(docId: string, eventId: string, userGender: "M" | "F"): Promise<string> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  
  // 같은 이벤트의 입금 완료된 사용자들의 닉네임 목록 가져오기
  const eventApplications = await getApplicationsByEventId(eventId);
  const paidApplications = eventApplications.filter(app => app.status === "paid" && app.nickname);
  const usedNicknames = new Set(paidApplications.map(app => app.nickname).filter(Boolean) as string[]);
  
  // 성별별 닉네임 풀
  const femaleNicknames = ["영아", "일영", "이슬", "삼순", "사린", "오연", "윤아", "철아"];
  const maleNicknames = ["영석", "일우", "이정", "삼식", "사철", "오룡", "윤경", "철수"];
  
  const nicknamePool = userGender === "F" ? femaleNicknames : maleNicknames;
  
  // 사용 가능한 닉네임 찾기
  const availableNicknames = nicknamePool.filter(nickname => !usedNicknames.has(nickname));
  
  if (availableNicknames.length === 0) {
    throw new Error("사용 가능한 닉네임이 없습니다.");
  }
  
  // 랜덤하게 선택
  const randomIndex = Math.floor(Math.random() * availableNicknames.length);
  const selectedNickname = availableNicknames[randomIndex];
  
  // 닉네임 할당
  const applicationRef = doc(db, applicationsCollection, docId);
  await updateDoc(applicationRef, { nickname: selectedNickname });
  
  return selectedNickname;
}

// 하위 호환성을 위한 함수 (uid만 사용하는 경우)
export async function updateApplicationStatusByUid(uid: string, status: ApplicationStatus, eventId?: string): Promise<void> {
  const docId = eventId ? `${uid}_${eventId}` : uid;
  return updateApplicationStatus(docId, status);
}

export async function getAllApplications(): Promise<(Application & { docId: string })[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, applicationsCollection));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      uid: data.uid || doc.id.split('_')[0], // uid가 없으면 docId에서 추출
      docId: doc.id, // 실제 문서 ID 저장
      ...data,
      createdAt: convertTimestampToDate(data.createdAt)
    } as Application & { docId: string };
  });
}

export async function getApplicationsByStatus(status: ApplicationStatus): Promise<Application[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, applicationsCollection), where("status", "==", status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      uid: data.uid || doc.id.split('_')[0],
      ...data,
      createdAt: convertTimestampToDate(data.createdAt)
    } as Application;
  });
}

// 행사별 지원서 조회
export async function getApplicationsByEventId(eventId: string): Promise<(Application & { docId: string })[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, applicationsCollection), where("eventId", "==", eventId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: data.uid || doc.id.split('_')[0],
      docId: doc.id,
      ...data,
      createdAt: convertTimestampToDate(data.createdAt)
    } as Application & { docId: string };
  });
}

