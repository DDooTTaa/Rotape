"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { createUser, getUser } from "@/lib/firebase/users";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

export const dynamic = 'force-dynamic';

// 눈송이 컴포넌트
function Snowflake({ delay, duration, left, initialTop }: { delay: number; duration: number; left: number; initialTop: number }) {
  const size = Math.random() * 15 + 18; // 18-33px 크기
  return (
    <div
      className="absolute text-white pointer-events-none select-none snowflake-mobile"
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
  const [isKakaoBrowser, setIsKakaoBrowser] = useState(false);
  const [userAgentString, setUserAgentString] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  // 카카오톡 인앱 브라우저 감지
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      const userAgentLower = userAgent.toLowerCase();
      
      // 다양한 카카오톡 브라우저 패턴 확인
      // 카카오톡 인앱 브라우저의 User-Agent는 보통 다음과 같습니다:
      // Android: "KAKAOTALK" 또는 "kakaotalk" 포함
      // iOS: "KAKAOTALK" 또는 "kakaotalk" 포함
      const isKakao = 
        userAgentLower.includes('kakaotalk') || 
        userAgentLower.includes('kakaobrowser') ||
        userAgent.includes('KAKAOTALK') ||
        userAgent.includes('KakaoTalk') ||
        /kakao/i.test(userAgent) ||
        // 추가 패턴: 카카오톡 웹뷰 감지
        (userAgentLower.includes('android') && userAgentLower.includes('wv') && userAgentLower.includes('kakao')) ||
        (userAgentLower.includes('iphone') && userAgentLower.includes('kakao')) ||
        (userAgentLower.includes('ipad') && userAgentLower.includes('kakao'));
      
      // 디버깅을 위한 로그 및 상태 저장
      console.log('User-Agent:', userAgent);
      console.log('카카오톡 브라우저 감지:', isKakao);
      setUserAgentString(userAgent);
      
      setIsKakaoBrowser(isKakao);
    }
  }, []);

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
    // 카카오톡 브라우저에서 구글 로그인 시도 시 경고
    if (isKakaoBrowser) {
      alert(
        "카톡 브라우저에선 Google 로그인이 지원되지 않아요.\n\n" +
        "1. 우측 상단의 '...' 메뉴를 클릭하세요\n" +
        "2. '다른 브라우저로 열기' 또는 '외부 브라우저로 열기'를 선택하세요\n" +
        "3. Chrome, Safari 등 기본 브라우저에서 다시 접속해주세요"
      );
      return;
    }

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
        // 리다이렉트 후에도 잠시 로딩 유지
        setTimeout(() => setLoading(false), 500);
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
      // 리다이렉트 후에도 잠시 로딩 유지
      setTimeout(() => setLoading(false), 500);
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
    <>
      {loading && <LoadingSpinner message="로그인 중..." />}
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

      {/* 우측 상단 ? 아이콘 */}
      {!showInfoModal && (
        <button
          onClick={() => setShowInfoModal(true)}
          className="fixed top-4 right-4 md:top-6 md:right-6 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white border-2 border-primary/30 shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="서비스 안내"
        >
        <span className="text-2xl md:text-3xl font-bold text-primary">?</span>
      </button>
      )}

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
            Rotape
          </h1>
          <p className="text-gray-700 text-2xl md:text-[32px] font-medium" style={{ fontFamily: "'Nanum Pen Script', cursive", marginTop: 24 }}>
            한 컷의 테이프처럼 영월할 당신의 인연
          </p>
        </div>

        {/* 카카오톡 브라우저 안내 */}
        {isKakaoBrowser && (
          <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg">
            <p className="text-sm font-semibold text-red-600 mb-2">
              ⚠️ 카톡 브라우저에선 Google 로그인이 지원되지 않아요
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-semibold">📱 접속 방법:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>우측 상단의 <span className="font-semibold">&apos;...&apos;</span> 메뉴 클릭</li>
                <li><span className="font-semibold">&apos;다른 브라우저로 열기&apos;</span> 또는 <span className="font-semibold">&apos;외부 브라우저로 열기&apos;</span> 선택</li>
                <li>Chrome, Safari 등 기본 브라우저에서 다시 접속</li>
              </ol>
            </div>
          </div>
        )}

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
            disabled={loading || isKakaoBrowser}
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

        {/* 서비스 안내 모달 */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-4">
            <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg md:text-2xl font-bold title-glow">
                  안녕하세요. Rotape입니다.
                </h2>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="닫기"
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 text-gray-700">
                {/* Rotape 소개 */}
                <section className="mb-6">
                  <div className="bg-gradient-to-r from-primary/10 to-[#0d4a1a]/10 rounded-xl p-5 border border-primary/20 mb-4">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 flex items-center gap-2">
                      <span className="text-2xl">🎞️</span>
                      Rotape
                    </h3>
                    <p className="text-base md:text-lg leading-relaxed text-gray-700">
                      <span className="font-semibold text-primary">Rotape</span>는 &quot;수많은 순간 속 한 컷의 인연을 테이프처럼&quot; 이라는 컨셉으로 만들어진 <span className="font-semibold text-primary">로테이션 소개팅 서비스</span>입니다.
                    </p>
                    <p className="text-sm md:text-base mt-3 text-gray-600 leading-relaxed">
                      여러 순간을 담아낼 수 있는 영화 테이프처럼, 여러 사람과의 만남을 통해 진정한 인연을 찾을 수 있도록 도와드립니다.
                    </p>
                  </div>
                </section>

                {/* 로테이션 소개팅 설명 */}
                <section>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 flex items-center gap-2">
                    <span className="text-2xl">💫</span>
                    <span className="bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">로테이션 소개팅이란?</span>
                  </h3>
                  <div className="space-y-3 text-sm md:text-base">
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <p className="font-semibold text-primary mb-2">🔄 로테이션 소개팅</p>
                      <p className="leading-relaxed">
                        여러 명의 참가자가 일정 시간마다 자리를 바꿔가며 대화를 나누는 방식입니다. 짧은 시간 동안 여러 사람과 만나볼 수 있어요!
                      </p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <p className="font-semibold text-primary mb-2">✨ 이런 점이 좋아요</p>
                      <ul className="space-y-2 list-disc list-inside leading-relaxed">
                        <li>한 번에 여러 분과 만나볼 수 있어 시간을 효율적으로 활용할 수 있어요</li>
                        <li>다양한 매력을 가진 분들을 한 자리에서 만날 수 있는 기회예요</li>
                        <li>부담스럽지 않은 분위기에서 자연스럽게 대화를 나눌 수 있어요</li>
                        <li>서로의 프로필과 사랑의 언어를 통해 인연을 찾을 수 있어요</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 이용 방법 */}
                <section>
                  <h3 className="text-xl md:text-2xl font-bold text-primary mb-3 flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    이용 방법
                  </h3>
                  <div className="space-y-3 text-sm md:text-base">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <div>
                        <p className="font-semibold">행사 신청</p>
                        <p className="text-gray-600">참여하고 싶은 행사를 선택하고 지원서를 작성하세요.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                        2
                      </span>
                      <div>
                        <p className="font-semibold">승인 대기</p>
                        <p className="text-gray-600">운영자가 지원서를 검토하고 승인합니다.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                        3
                      </span>
                      <div>
                        <p className="font-semibold">로테이션 참여</p>
                        <p className="text-gray-600">행사 당일 로테이션에 참여하여 여러 사람과 만나보세요.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                        4
                      </span>
                      <div>
                        <p className="font-semibold">이후에는?</p>
                        <p className="text-gray-600">서로 관심을 보인 상대와 인연을 이어 가세요. 저희가 도와드릴게요!</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="w-full bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

