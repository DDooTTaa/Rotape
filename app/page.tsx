"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { createUser, getUser } from "@/lib/firebase/users";
import Link from "next/link";

export const dynamic = 'force-dynamic';

// 눈송이 컴포넌트
function Snowflake({ delay, duration, left, initialTop }: { delay: number; duration: number; left: number; initialTop: number }) {
  const size = Math.random() * 15 + 18; // 18-33px 크기
  return (
    <div
      className="absolute text-white pointer-events-none select-none"
      style={{
        left: `${left}%`,
        top: `${initialTop}%`,
        animation: `snowfall ${duration}s linear ${delay}s infinite`,
        fontSize: `${size}px`,
        textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(173, 216, 230, 0.6)',
        filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.9))',
        opacity: 0.95,
      }}
    >
      ❄
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

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
          if (userData) {
            if (userData.isAdmin) {
              router.push("/admin");
            } else {
              // 모든 사용자를 행사 리스트로 이동
              router.push("/participant/events");
            }
          }
        } catch (error) {
          console.error("사용자 데이터 로드 실패:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
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

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth!, provider);
      const user = result.user;

      // 기존 사용자 확인
      const existingUser = await getUser(user.uid);

      if (existingUser) {
        // 기존 사용자
        if (existingUser.isAdmin) {
          router.push("/admin");
        } else {
          // 모든 사용자를 행사 리스트로 이동
          router.push("/participant/events");
        }
        setLoading(false);
        return;
      }

      // 신규 사용자 - 사용자 정보 추출
      const userData = {
        name: user.displayName || "",
        gender: "M" as const,
        birthday: "",
        age: 0,
        createdAt: new Date(),
        isAdmin: false,
      };

      // 사용자 문서 생성
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

      // 리다이렉트
      router.push("/participant/events");
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
      setLoading(false);
    }
  };


  const handleAcceptTerms = async () => {
    setTermsAccepted(true);
    setShowTerms(false);

    // 약관 동의 후 자동으로 로그인 처리
    if (!auth) return;

    try {
      if (!auth.currentUser) return;

      const user = auth.currentUser;
      const userData = await getUser(user.uid);
      if (userData) {
        if (userData.isAdmin) {
          router.push("/admin");
        } else {
          // 모든 사용자를 행사 리스트로 이동
          router.push("/participant/events");
        }
      }
    } catch (error) {
      console.error("리다이렉트 실패:", error);
    }
  };

  // 눈송이 생성
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; delay: number; duration: number; left: number; initialTop: number }>>([]);

  useEffect(() => {
    // 80개의 눈송이 생성 (더 많이)
    const flakes = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      delay: Math.random() * 2, // 0-2초로 줄임 (바로 보이도록)
      duration: Math.random() * 3 + 5, // 5-8초
      left: Math.random() * 100,
      initialTop: Math.random() * 100, // 화면 내 랜덤 위치에서 시작
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="min-h-screen text-foreground flex items-center justify-center px-4 relative overflow-hidden">
      {/* 눈송이 배경 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {snowflakes.map((flake) => (
          <Snowflake
            key={flake.id}
            delay={flake.delay}
            duration={flake.duration}
            left={flake.left}
            initialTop={flake.initialTop}
          />
        ))}
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
            Rotape
          </h1>
          <p className="text-gray-700 text-base font-medium">
            당신의 인연이 한 컷의 테이프처럼 남기를
          </p>
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
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-900 px-6 py-4 rounded-xl font-semibold hover:bg-gradient-to-r hover:from-primary hover:to-[#0d4a1a] hover:text-white transition-all duration-300 disabled:opacity-50 border-2 border-primary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
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
        </div>

        {/* <div className="mt-6 text-center">
          <Link
            href="/adminLogin"
            className="text-primary hover:underline text-sm font-semibold"
          >
            운영자 로그인
          </Link>
        </div> */}

        {showTerms && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white border-2 border-primary/20 rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">약관 동의</h2>
              <div className="max-h-64 overflow-y-auto mb-4 text-sm space-y-2">
                <p>서비스 이용약관에 동의해주세요.</p>
                <p>개인정보 처리방침에 동의해주세요.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowTerms(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-300"
                >
                  취소
                </button>
                <button
                  onClick={handleAcceptTerms}
                  className="flex-1 bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
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

