"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, OAuthProvider, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { createUser, getUser } from "@/lib/firebase/users";

declare global {
  interface Window {
    Kakao: any;
  }
}

export const dynamic = 'force-dynamic';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  // 카카오톡 SDK 초기화
  useEffect(() => {
    const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    
    if (!kakaoAppKey) {
      console.warn("카카오톡 앱 키가 설정되지 않았습니다.");
      setKakaoReady(false);
      return;
    }

    const initKakao = () => {
      if (window.Kakao && typeof window.Kakao.init === 'function') {
        try {
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init(kakaoAppKey);
            console.log("카카오톡 SDK 초기화 완료");
          } else {
            console.log("카카오톡 SDK 이미 초기화됨");
          }
          
          // 초기화 확인
          if (window.Kakao.isInitialized()) {
            console.log("카카오톡 SDK 초기화 확인:", window.Kakao.isInitialized());
            setKakaoReady(true);
          } else {
            console.error("카카오톡 SDK 초기화 실패");
            setKakaoReady(false);
          }
        } catch (error) {
          console.error("카카오톡 SDK 초기화 오류:", error);
          setKakaoReady(false);
        }
      } else {
        console.warn("카카오톡 SDK가 아직 로드되지 않았습니다.");
        setKakaoReady(false);
      }
    };

    // 이미 SDK가 로드되어 있으면 바로 초기화
    if (typeof window !== "undefined" && window.Kakao) {
      initKakao();
    } else {
      // SDK 스크립트 로드
      const script = document.createElement("script");
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js";
      script.crossOrigin = "anonymous";
      script.async = true;
      script.onload = () => {
        console.log("카카오톡 SDK 스크립트 로드 완료");
        // SDK가 완전히 로드될 때까지 약간 대기
        setTimeout(() => {
          if (window.Kakao && typeof window.Kakao.init === 'function') {
            initKakao();
          } else {
            console.error("카카오톡 SDK 초기화 함수를 찾을 수 없습니다.");
            setKakaoReady(false);
          }
        }, 100);
      };
      script.onerror = () => {
        console.error("카카오톡 SDK 스크립트 로드 실패");
        setKakaoReady(false);
      };
      document.head.appendChild(script);
    }
  }, []);

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

        // 신규 사용자도 행사 리스트로 이동
        router.push("/participant/events");
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

        // 신규 사용자도 행사 리스트로 이동
        router.push("/participant/events");
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

  const handleKakaoLogin = async () => {
    if (!auth) {
      alert("인증 서비스를 사용할 수 없습니다.");
      return;
    }

    // SDK 초기화 확인
    if (!window.Kakao || !window.Kakao.isInitialized || !window.Kakao.isInitialized()) {
      const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
      if (kakaoAppKey && window.Kakao && typeof window.Kakao.init === 'function') {
        try {
          window.Kakao.init(kakaoAppKey);
        } catch (error) {
          console.error("카카오톡 SDK 초기화 실패:", error);
          alert("카카오톡 로그인 초기화에 실패했습니다.");
          return;
        }
      } else {
        alert("카카오톡 로그인을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }
    }

    if (!window.Kakao || !window.Kakao.Auth || !window.Kakao.Auth.login) {
      alert("카카오톡 로그인을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 카카오톡 로그인
      window.Kakao.Auth.login({
        success: async (authObj: any) => {
          try {
            // 카카오톡 사용자 정보 가져오기
            window.Kakao.API.request({
              url: "/v2/user/me",
              success: async (res: any) => {
                try {
                  const kakaoId = res.id.toString();
                  const nickname = res.kakao_account?.profile?.nickname || res.properties?.nickname || "";
                  const email = res.kakao_account?.email || `${kakaoId}@kakao.com`;

                  // 서버에서 Custom Token 생성 요청
                  const response = await fetch("/api/auth/kakao", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      kakaoId,
                      nickname,
                      email,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("Custom Token 생성 실패");
                  }

                  const { customToken } = await response.json();

                  // Custom Token으로 Firebase 로그인
                  const userCredential = await signInWithCustomToken(auth!, customToken);
                  const user = userCredential.user;

                  // 기존 사용자 확인
                  const existingUser = await getUser(user.uid);

                  if (!existingUser) {
                    // 신규 사용자 - 사용자 문서 생성
                    const userData = {
                      name: nickname || "카카오톡 사용자",
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

                    // 신규 사용자도 행사 리스트로 이동
                    router.push("/participant/events");
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
                  console.error("카카오톡 사용자 정보 처리 실패:", error);
                  alert("카카오톡 로그인에 실패했습니다.");
                  setLoading(false);
                }
              },
              fail: (err: any) => {
                console.error("카카오톡 사용자 정보 조회 실패:", err);
                alert("카카오톡 사용자 정보를 가져오는데 실패했습니다.");
                setLoading(false);
              },
            });
          } catch (error) {
            console.error("카카오톡 로그인 처리 실패:", error);
            alert("카카오톡 로그인에 실패했습니다.");
            setLoading(false);
          }
        },
        fail: (err: any) => {
          console.error("카카오톡 로그인 실패:", err);
          alert("카카오톡 로그인에 실패했습니다.");
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("카카오톡 로그인 오류:", error);
      alert("카카오톡 로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    setTermsAccepted(true);
    setShowTerms(false);
    
    // 모든 사용자를 행사 리스트로 이동
    router.push("/participant/events");
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

          <button
            onClick={handleKakaoLogin}
            disabled={loading || !kakaoReady}
            className="w-full bg-[#FEE500] text-[#000000] px-6 py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              "로그인 중..."
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3Z"/>
                </svg>
                카카오톡으로 로그인
              </>
            )}
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

