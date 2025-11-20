import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { Application, ApplicationStatus } from "./types";

const applicationsCollection = "applications";

export async function createApplication(uid: string, applicationData: Omit<Application, "uid" | "status" | "createdAt">): Promise<void> {
  const applicationRef = doc(db, applicationsCollection, uid);
  await setDoc(applicationRef, {
    ...applicationData,
    status: "pending" as ApplicationStatus,
    createdAt: new Date(),
  });
}

export async function getApplication(uid: string): Promise<Application | null> {
  const applicationRef = doc(db, applicationsCollection, uid);
  const applicationSnap = await getDoc(applicationRef);
  
  if (applicationSnap.exists()) {
    return { uid, ...applicationSnap.data() } as Application;
  }
  return null;
}

export async function updateApplicationStatus(uid: string, status: ApplicationStatus): Promise<void> {
  const applicationRef = doc(db, applicationsCollection, uid);
  await updateDoc(applicationRef, { status });
}

export async function getAllApplications(): Promise<Application[]> {
  const q = query(collection(db, applicationsCollection));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Application));
}

export async function getApplicationsByStatus(status: ApplicationStatus): Promise<Application[]> {
  const q = query(collection(db, applicationsCollection), where("status", "==", status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Application));
}

