"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { createUser, getUser } from "@/lib/firebase/users";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleGoogleLogin = async () => {
    if (!auth) {
      alert("인증 서비스를 사용할 수 없습니다.");
      return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth!, provider);
      const user = result.user;

      // 기존 사용자 확인
      const existingUser = await getUser(user.uid);

      if (!existingUser) {
        // 신규 사용자 - 사용자 문서 생성
        const userData = {
          name: user.displayName || "",
          gender: "M" as const, // 기본값, 지원서에서 수정
          birthday: "", // 지원서에서 입력
          age: 0, // 지원서에서 계산
          createdAt: new Date(),
          isAdmin: false,
        };

        try {
          await createUser(user.uid, userData);
        } catch (error) {
          console.log("사용자 생성 실패:", error);
        }

        // 약관 동의 확인
        if (!termsAccepted) {
          setShowTerms(true);
          setLoading(false);
          return;
        }

        // 신규 사용자는 내 정보 기입 페이지로
        router.push("/participant/application");
      } else {
        // 기존 사용자 - 약관 동의 확인
        if (!termsAccepted) {
          setShowTerms(true);
          setLoading(false);
          return;
        }

        // 기존 사용자는 행사 리스트로
        router.push("/participant/events");
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!auth) {
      alert("인증 서비스를 사용할 수 없습니다.");
      return;
    }
    setLoading(true);
    try {
      const provider = new OAuthProvider("apple.com");
      const result = await signInWithPopup(auth!, provider);
      const user = result.user;

      // 기존 사용자 확인
      const existingUser = await getUser(user.uid);

      if (!existingUser) {
        // 신규 사용자 - 사용자 문서 생성
        const userData = {
          name: user.displayName || "",
          gender: "M" as const,
          birthday: "",
          age: 0,
          createdAt: new Date(),
          isAdmin: false,
        };

        try {
          await createUser(user.uid, userData);
        } catch (error) {
          console.log("사용자 생성 실패:", error);
        }

        // 약관 동의 확인
        if (!termsAccepted) {
          setShowTerms(true);
          setLoading(false);
          return;
        }

        // 신규 사용자는 내 정보 기입 페이지로
        router.push("/participant/application");
      } else {
        // 기존 사용자 - 약관 동의 확인
        if (!termsAccepted) {
          setShowTerms(true);
          setLoading(false);
          return;
        }

        // 기존 사용자는 행사 리스트로
        router.push("/participant/events");
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    setTermsAccepted(true);
    setShowTerms(false);
    
    // 현재 사용자 확인
    if (!auth) {
      router.push("/participant/application");
      return;
    }
    
    const currentUser = auth.currentUser;
    if (currentUser) {
      const existingUser = await getUser(currentUser.uid);
      if (existingUser) {
        // 기존 사용자는 행사 리스트로
        router.push("/participant/events");
      } else {
        // 신규 사용자는 내 정보 기입 페이지로
        router.push("/participant/application");
      }
    } else {
      router.push("/participant/application");
    }
  };

  return (
    <div className="min-h-screen bg-white text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">로그인</h1>
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-900 px-6 py-4 rounded-lg font-semibold hover:bg-primary hover:text-white transition disabled:opacity-50 border-2 border-primary flex items-center justify-center gap-3"
          >
            {loading ? (
              "로그인 중..."
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google로 로그인
              </>
            )}
          </button>
          
          <button
            onClick={handleAppleLogin}
            disabled={loading}
            className="w-full bg-black text-white px-6 py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "Apple로 로그인"}
          </button>
        </div>

        {showTerms && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white border border-primary/20 rounded-lg p-6 max-w-md w-full shadow-lg">
              <h2 className="text-2xl font-bold mb-4">약관 동의</h2>
              <div className="max-h-64 overflow-y-auto mb-4 text-sm space-y-2">
                <p>서비스 이용약관에 동의해주세요.</p>
                <p>개인정보 처리방침에 동의해주세요.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowTerms(false)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  취소
                </button>
                <button
                  onClick={handleAcceptTerms}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  동의
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

