"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { createUser, getUser, updateUser } from "@/lib/firebase/users";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // 운영자 키 (환경 변수 또는 하드코딩)
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || "1532";
  // 운영자 이메일 (환경 변수 또는 기본값)
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@rotape.com";

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth가 초기화되지 않았습니다. .env.local 파일을 확인하세요.");
      setIsFirebaseReady(false);
      return;
    }

    setIsFirebaseReady(true);
    
    // 이미 로그인된 사용자 확인
    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      if (user) {
        try {
          const userData = await getUser(user.uid);
          if (userData && userData.isAdmin) {
            router.push("/admin");
          }
        } catch (error) {
          console.error("사용자 데이터 로드 실패:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleAdminKeyLogin = async () => {
    if (!auth) {
      alert(
        "Firebase 인증 서비스를 사용할 수 없습니다.\n\n" +
        "다음을 확인해주세요:\n" +
        "1. .env.local 파일이 프로젝트 루트에 있는지\n" +
        "2. Firebase 환경 변수가 올바르게 설정되었는지\n" +
        "3. 개발 서버를 재시작했는지\n\n" +
        "자세한 설정 방법은 FIREBASE_SETUP.md 파일을 참고하세요."
      );
      return;
    }

    if (!adminKey) {
      alert("운영자 키를 입력해주세요.");
      return;
    }

    if (adminKey !== ADMIN_KEY) {
      alert("운영자 키가 올바르지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const email = ADMIN_EMAIL;
      
      // 먼저 로그인 시도
      try {
        const result = await signInWithEmailAndPassword(auth!, email, adminKey);
        const user = result.user;

        // 인증 상태가 완전히 반영될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 500));

        // 기존 사용자 확인 및 업데이트
        const existingUser = await getUser(user.uid);
        if (existingUser) {
          if (!existingUser.isAdmin) {
            await updateUser(user.uid, { isAdmin: true });
          }
          router.push("/admin");
        } else {
          // 신규 사용자 생성
          const userData = {
            name: "운영자",
            gender: "M" as const,
            birthday: "",
            age: 0,
            createdAt: new Date(),
            isAdmin: true,
          };
          await createUser(user.uid, userData);
          router.push("/admin");
        }
      } catch (error: any) {
        // 계정이 없으면 생성
        if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
          try {
            const result = await createUserWithEmailAndPassword(auth!, email, adminKey);
            const user = result.user;

            // 인증 상태가 완전히 반영될 때까지 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 500));

            const userData = {
              name: "운영자",
              gender: "M" as const,
              birthday: "",
              age: 0,
              createdAt: new Date(),
              isAdmin: true,
            };
            await createUser(user.uid, userData);
            router.push("/admin");
          } catch (createError: any) {
            console.error("계정 생성 실패:", createError);
            alert("운영자 계정 생성에 실패했습니다: " + createError.message);
          }
        } else {
          console.error("로그인 실패:", error);
          alert("로그인에 실패했습니다: " + error.message);
        }
      }
    } catch (error: any) {
      console.error("오류:", error);
      alert("오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
            운영자 로그인
          </h1>
          <p className="text-gray-600 text-lg">관리자 전용 로그인</p>
        </div>

        {/* Firebase 설정 안내 */}
        {!isFirebaseReady && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-sm font-semibold text-yellow-600 mb-2">
              ⚠️ Firebase가 설정되지 않았습니다
            </p>
            <p className="text-xs text-gray-700 mb-2">
              프로젝트 루트에 .env.local 파일을 생성하고 Firebase 설정을 추가하세요.
            </p>
            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-300">
                설정 방법 보기
              </summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-left">
                <p className="mb-1">1. .env.local 파일 생성</p>
                <p className="mb-1">2. Firebase Console에서 설정 값 가져오기</p>
                <p className="mb-1">3. 환경 변수 추가 후 서버 재시작</p>
                <p className="text-yellow-400 mt-2">
                  자세한 내용: FIREBASE_SETUP.md 참고
                </p>
              </div>
            </details>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-semibold">운영자 키</label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="운영자 키를 입력하세요"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAdminKeyLogin();
                }
              }}
              className="input-elegant"
            />
          </div>
          <button
            onClick={handleAdminKeyLogin}
            disabled={loading || !adminKey}
            className="w-full bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "운영자로 로그인"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-primary hover:underline text-sm font-semibold"
          >
            ← 사용자 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

