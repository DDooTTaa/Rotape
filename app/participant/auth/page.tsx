"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/firebase/users";

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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 사용자 정보 추출
      const userData = {
        name: user.displayName || "",
        gender: "M" as const, // 기본값, 지원서에서 수정
        birthday: "", // 지원서에서 입력
        age: 0, // 지원서에서 계산
        createdAt: new Date(),
        isAdmin: false,
      };

      // 사용자 문서 생성 (이미 있으면 스킵)
      try {
        await createUser(user.uid, userData);
      } catch (error) {
        console.log("사용자 이미 존재하거나 생성 실패:", error);
      }

      // 약관 동의 확인
      if (!termsAccepted) {
        setShowTerms(true);
        setLoading(false);
        return;
      }

      router.push("/participant/application");
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

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
        console.log("사용자 이미 존재하거나 생성 실패:", error);
      }

      if (!termsAccepted) {
        setShowTerms(true);
        setLoading(false);
        return;
      }

      router.push("/participant/application");
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowTerms(false);
    router.push("/participant/application");
  };

  return (
    <div className="min-h-screen bg-deep-green text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">로그인</h1>
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-900 px-6 py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "Google로 로그인"}
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
            <div className="bg-deep-green rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">약관 동의</h2>
              <div className="max-h-64 overflow-y-auto mb-4 text-sm space-y-2">
                <p>서비스 이용약관에 동의해주세요.</p>
                <p>개인정보 처리방침에 동의해주세요.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowTerms(false)}
                  className="flex-1 bg-gray-600 px-4 py-2 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={handleAcceptTerms}
                  className="flex-1 bg-primary text-deep-green px-4 py-2 rounded-lg font-semibold"
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

