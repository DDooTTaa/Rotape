import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { Profile } from "./types";

const profilesCollection = "profiles";

export async function createProfile(uid: string, profileData: Omit<Profile, "uid">): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const profileRef = doc(db, profilesCollection, uid);
  await setDoc(profileRef, profileData);
}

export async function getProfile(uid: string): Promise<Profile | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const profileRef = doc(db, profilesCollection, uid);
  const profileSnap = await getDoc(profileRef);
  
  if (profileSnap.exists()) {
    return { uid, ...profileSnap.data() } as Profile;
  }
  return null;
}

export async function getProfilesByEvent(eventId: string): Promise<Profile[]> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const q = query(collection(db, profilesCollection), where("eventId", "==", eventId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Profile));
}

