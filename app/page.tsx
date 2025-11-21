"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, OAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { createUser, getUser, updateUser } from "@/lib/firebase/users";

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // 운영자 키 (환경 변수 또는 하드코딩)
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || "admin1234";
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
          if (userData) {
            if (userData.isAdmin) {
              router.push("/admin");
            } else {
              // 사용자 정보가 완전한지 확인 (birthday와 age가 있는지)
              if (userData.birthday && userData.age > 0) {
                router.push("/participant/events");
              } else {
                router.push("/participant/application");
              }
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

    // 운영자 키 확인
    if (isAdminMode && adminKey !== ADMIN_KEY) {
      alert("운영자 키가 올바르지 않습니다.");
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
        // 기존 사용자 - 운영자 키로 권한 업데이트 가능
        if (isAdminMode && adminKey === ADMIN_KEY) {
          await updateUser(user.uid, { isAdmin: true });
          router.push("/admin");
        } else {
          if (existingUser.isAdmin) {
            router.push("/admin");
          } else {
            // 사용자 정보가 완전한지 확인
            if (existingUser.birthday && existingUser.age > 0) {
              router.push("/participant/events");
            } else {
              router.push("/participant/application");
            }
          }
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
        isAdmin: isAdminMode && adminKey === ADMIN_KEY,
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
      if (userData.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/participant/application");
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
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

    // 운영자 키 확인
    if (isAdminMode && adminKey !== ADMIN_KEY) {
      alert("운영자 키가 올바르지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const provider = new OAuthProvider("apple.com");
      const result = await signInWithPopup(auth!, provider);
      const user = result.user;

      // 기존 사용자 확인
      const existingUser = await getUser(user.uid);
      
      if (existingUser) {
        // 기존 사용자 - 운영자 키로 권한 업데이트 가능
        if (isAdminMode && adminKey === ADMIN_KEY) {
          await updateUser(user.uid, { isAdmin: true });
          router.push("/admin");
        } else {
          if (existingUser.isAdmin) {
            router.push("/admin");
          } else {
            // 사용자 정보가 완전한지 확인
            if (existingUser.birthday && existingUser.age > 0) {
              router.push("/participant/events");
            } else {
              router.push("/participant/application");
            }
          }
        }
        setLoading(false);
        return;
      }

      const userData = {
        name: user.displayName || "",
        gender: "M" as const,
        birthday: "",
        age: 0,
        createdAt: new Date(),
        isAdmin: isAdminMode && adminKey === ADMIN_KEY,
      };

      try {
        await createUser(user.uid, userData);
      } catch (error) {
        console.log("사용자 생성 실패:", error);
      }

      if (!termsAccepted) {
        setShowTerms(true);
        setLoading(false);
        return;
      }

      if (userData.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/participant/application");
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
      setLoading(false);
    }
  };

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
      const email = adminEmail || ADMIN_EMAIL;
      
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
          // 사용자 정보가 완전한지 확인
          if (userData.birthday && userData.age > 0) {
            router.push("/participant/events");
          } else {
            router.push("/participant/application");
          }
        }
      }
    } catch (error) {
      console.error("리다이렉트 실패:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Rotape</h1>
          <p className="text-gray-300">로테이션 소개팅 서비스</p>
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

        {/* 운영자 모드 토글 */}
        <div className="mb-6">
          <label className="flex items-center justify-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAdminMode}
              onChange={(e) => setIsAdminMode(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-sm">운영자 모드</span>
          </label>
        </div>

        {/* 운영자 모드일 때 */}
        {isAdminMode ? (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-semibold">운영자 이메일 (선택사항)</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder={`기본값: ${ADMIN_EMAIL}`}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border border-primary/30 mb-4"
              />
            </div>
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
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border border-primary/30"
              />
            </div>
            <button
              onClick={handleAdminKeyLogin}
              disabled={loading || !adminKey}
              className="w-full bg-primary text-white px-6 py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "운영자로 로그인"}
            </button>
          </div>
        ) : (
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
        )}

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
                  className="flex-1 bg-gray-600 px-4 py-2 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={handleAcceptTerms}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold"
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

