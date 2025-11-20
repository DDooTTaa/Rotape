import { collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";
import { User } from "./types";

const usersCollection = "users";

export async function createUser(uid: string, userData: Omit<User, "uid">): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const userRef = doc(db, usersCollection, uid);
  await setDoc(userRef, {
    ...userData,
    createdAt: new Date(),
  });
}

export async function getUser(uid: string): Promise<User | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const userRef = doc(db, usersCollection, uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { uid, ...userSnap.data() } as User;
  }
  return null;
}

export async function updateUser(uid: string, updates: Partial<User>): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const userRef = doc(db, usersCollection, uid);
  await updateDoc(userRef, updates);
}

