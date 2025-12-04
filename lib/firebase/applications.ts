import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp, runTransaction } from "firebase/firestore";
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

// 닉네임 할당 함수 (트랜잭션 사용으로 중복 방지)
export async function assignNickname(docId: string, eventId: string, userGender: "M" | "F"): Promise<string> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  
  // 성별별 닉네임 풀
  const femaleNicknames = ["영아", "일영", "이슬", "삼순", "사린", "오연", "윤아", "철아"];
  const maleNicknames = ["영석", "일우", "이정", "삼식", "사철", "오룡", "윤경", "철수"];
  const nicknamePool = userGender === "F" ? femaleNicknames : maleNicknames;
  
  const applicationRef = doc(db, applicationsCollection, docId);
  
  // 트랜잭션으로 원자적 처리하여 중복 방지
  // 최대 5번 재시도 (동시성 충돌 시)
  let retries = 0;
  const maxRetries = 5;
  
  while (retries < maxRetries) {
    try {
      // 트랜잭션 전에 같은 이벤트의 모든 지원서 문서 ID 목록 가져오기
      // (트랜잭션 내에서는 쿼리를 직접 실행할 수 없으므로)
      const eventApplicationsQuery = query(
        collection(db, applicationsCollection),
        where("eventId", "==", eventId)
      );
      const eventApplicationsSnapshot = await getDocs(eventApplicationsQuery);
      
      // 트랜잭션 내에서 읽을 문서 참조 목록 생성
      const docRefs: ReturnType<typeof doc>[] = [];
      eventApplicationsSnapshot.docs.forEach((docSnap) => {
        docRefs.push(doc(db!, applicationsCollection, docSnap.id));
      });
      
      return await runTransaction(db, async (transaction) => {
        // 현재 문서 읽기
        const appSnap = await transaction.get(applicationRef);
        if (!appSnap.exists()) {
          throw new Error(`문서를 찾을 수 없습니다: ${docId}`);
        }
        
        const currentData = appSnap.data() as Application;
        
        // 이미 닉네임이 있으면 그대로 반환
        if (currentData.nickname) {
          return currentData.nickname;
        }
        
        // 트랜잭션 내에서 모든 문서 읽기 (최신 상태 확인)
        const allDocs = await Promise.all(docRefs.map(ref => transaction.get(ref)));
        
        // 사용된 닉네임 목록 생성
        const usedNicknames = new Set<string>();
        allDocs.forEach((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Application;
            // 현재 문서가 아니고, 입금 완료 상태이며, 닉네임이 있는 경우
            if (docSnap.id !== docId && data.status === "paid" && data.nickname) {
              usedNicknames.add(data.nickname);
            }
          }
        });
  
  // 사용 가능한 닉네임 찾기
  const availableNicknames = nicknamePool.filter(nickname => !usedNicknames.has(nickname));
  
  if (availableNicknames.length === 0) {
    throw new Error("사용 가능한 닉네임이 없습니다.");
  }
  
  // 랜덤하게 선택
  const randomIndex = Math.floor(Math.random() * availableNicknames.length);
  const selectedNickname = availableNicknames[randomIndex];
  
        // 트랜잭션 내에서 닉네임 할당
        transaction.update(applicationRef, { nickname: selectedNickname });
  
  return selectedNickname;
      });
    } catch (error: any) {
      // 트랜잭션 충돌 시 재시도
      if (error.code === 'failed-precondition' || error.code === 'aborted') {
        retries++;
        if (retries >= maxRetries) {
          throw new Error("닉네임 할당에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
        // 짧은 지연 후 재시도
        await new Promise(resolve => setTimeout(resolve, 100 * retries));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error("닉네임 할당에 실패했습니다.");
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

