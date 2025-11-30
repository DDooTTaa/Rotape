import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// 환경 확인
const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development";
const isDevelopment = env === "development";
const isProduction = env === "production";

// 환경 변수 검증
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 개발 환경에서만 경고 표시
if (typeof window !== "undefined" && isDevelopment) {
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
  } else {
    console.log(
      `✅ Firebase 설정 완료 - 환경: ${isDevelopment ? "개발" : isProduction ? "프로덕션" : "알 수 없음"}`
    );
    console.log(`프로젝트 ID: ${requiredEnvVars.projectId}`);
  }
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey || "demo-api-key",
  authDomain: requiredEnvVars.authDomain || "demo-project.firebaseapp.com",
  projectId: requiredEnvVars.projectId || "demo-project",
  storageBucket: requiredEnvVars.storageBucket || "demo-project.appspot.com",
  messagingSenderId: requiredEnvVars.messagingSenderId || "123456789",
  appId: requiredEnvVars.appId || "1:123456789:web:abcdef",
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== "undefined") {
  try {
    if (!getApps().length) {
      // 환경 변수가 모두 설정되었는지 확인
      const hasValidConfig = Object.values(requiredEnvVars).every(
        (val) => val && val !== "demo-api-key"
      );

      if (!hasValidConfig) {
        console.error(
          "❌ Firebase 환경 변수가 올바르게 설정되지 않았습니다."
        );
        console.error(
          `현재 환경: ${isDevelopment ? "개발" : isProduction ? "프로덕션" : "알 수 없음"}`
        );
        console.error(
          "프로젝트 루트에 .env.local (개발용) 또는 .env.production (프로덕션용) 파일을 생성하고 다음을 추가하세요:"
        );
        console.error(`
NEXT_PUBLIC_ENV=${isDevelopment ? "development" : "production"}
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
        `);
        // 환경 변수가 없어도 초기화는 시도 (개발용)
        // 실제 사용 시 오류가 발생할 수 있음
      }
      
      // 환경 변수가 없어도 초기화 시도 (개발 중 테스트용)
      try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
      } catch (initError: any) {
        console.error("Firebase 초기화 실패:", initError);
        // 초기화 실패해도 계속 진행 (개발 중)
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

