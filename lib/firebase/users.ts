import { collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";
import { User } from "./types";

const usersCollection = "users";

export async function createUser(uid: string, userData: Omit<User, "uid">): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  try {
    const userRef = doc(db, usersCollection, uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
    });
  } catch (error: any) {
    console.error("createUser 오류:", error);
    console.error("오류 코드:", error.code);
    console.error("오류 메시지:", error.message);
    throw error;
  }
}

export async function getUser(uid: string): Promise<User | null> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  try {
    const userRef = doc(db, usersCollection, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { uid, ...userSnap.data() } as User;
    }
    return null;
  } catch (error: any) {
    console.error("getUser 오류:", error);
    console.error("오류 코드:", error.code);
    console.error("오류 메시지:", error.message);
    throw error;
  }
}

export async function updateUser(uid: string, updates: Partial<User>): Promise<void> {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");
  const userRef = doc(db, usersCollection, uid);
  await updateDoc(userRef, updates);
}

