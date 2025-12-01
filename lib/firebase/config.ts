import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// 환경 변수 검증
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 환경 변수가 모두 있는지 확인
const hasAllRequiredVars = Object.values(requiredEnvVars).every(
  (val) => val && typeof val === "string" && val.length > 0
);

// 개발 환경에서만 경고 표시
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.warn(
      "⚠️ Firebase 환경 변수가 설정되지 않았습니다:",
      missingVars.join(", ")
    );
    console.warn(
      ".env.local 파일을 생성하고 Firebase 설정을 추가하세요."
    );
  }
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey || "",
  authDomain: requiredEnvVars.authDomain || "",
  projectId: requiredEnvVars.projectId || "",
  storageBucket: requiredEnvVars.storageBucket || "",
  messagingSenderId: requiredEnvVars.messagingSenderId || "",
  appId: requiredEnvVars.appId || "",
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== "undefined") {
  try {
    if (!getApps().length) {
      // 환경 변수가 모두 설정되었는지 확인
      if (!hasAllRequiredVars) {
        console.error(
          "❌ Firebase 환경 변수가 올바르게 설정되지 않았습니다."
        );
        console.error(
          `현재 환경: ${isDevelopment ? "개발" : isProduction ? "프로덕션" : "알 수 없음"}`
        );
        console.error("로드된 환경 변수 상태:", {
          apiKey: requiredEnvVars.apiKey ? "✅" : "❌",
          authDomain: requiredEnvVars.authDomain ? "✅" : "❌",
          projectId: requiredEnvVars.projectId ? "✅" : "❌",
          storageBucket: requiredEnvVars.storageBucket ? "✅" : "❌",
          messagingSenderId: requiredEnvVars.messagingSenderId ? "✅" : "❌",
          appId: requiredEnvVars.appId ? "✅" : "❌",
        });
        console.error(
          "프로젝트 루트에 .env.local 파일을 확인하고 개발 서버를 재시작하세요."
        );
        // 환경 변수가 없으면 초기화하지 않음
        throw new Error("Firebase 환경 변수가 설정되지 않았습니다.");
      }
      
      // 환경 변수가 모두 있을 때만 초기화
      try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        console.log("✅ Firebase 초기화 성공:", firebaseConfig.projectId);
      } catch (initError: any) {
        console.error("Firebase 초기화 실패:", initError);
        throw initError;
      }
    } else {
      app = getApps()[0];
      try {
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
      } catch (error) {
        console.error("Firebase 서비스 초기화 실패:", error);
      }
    }
  } catch (error) {
    console.error("Firebase 초기화 오류:", error);
  }
}

export { app, auth, db, storage };

