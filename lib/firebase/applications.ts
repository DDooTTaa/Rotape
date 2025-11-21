import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { Application, ApplicationStatus } from "./types";

const applicationsCollection = "applications";

export async function createApplication(uid: string, applicationData: Omit<Application, "uid" | "status" | "createdAt">, eventId?: string): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  // eventId가 있으면 {uid}_{eventId} 형태로, 없으면 uid만 사용
  const docId = eventId ? `${uid}_${eventId}` : uid;
  const applicationRef = doc(db, applicationsCollection, docId);
  await setDoc(applicationRef, {
    uid, // uid 필드를 명시적으로 저장
    ...applicationData,
    eventId: eventId || undefined,
    status: "pending" as ApplicationStatus,
    createdAt: new Date(),
  });
}

export async function getApplication(uid: string, eventId?: string): Promise<Application | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  // eventId가 있으면 {uid}_{eventId} 형태로, 없으면 uid만 사용
  const docId = eventId ? `${uid}_${eventId}` : uid;
  const applicationRef = doc(db, applicationsCollection, docId);
  const applicationSnap = await getDoc(applicationRef);
  
  if (applicationSnap.exists()) {
    return { uid, ...applicationSnap.data() } as Application;
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
      ...data 
    } as Application;
  });
  return applications;
}

export async function updateApplicationStatus(uid: string, status: ApplicationStatus): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const applicationRef = doc(db, applicationsCollection, uid);
  await updateDoc(applicationRef, { status });
}

export async function getAllApplications(): Promise<Application[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, applicationsCollection));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Application));
}

export async function getApplicationsByStatus(status: ApplicationStatus): Promise<Application[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, applicationsCollection), where("status", "==", status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Application));
}

