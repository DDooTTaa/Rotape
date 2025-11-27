"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { createUser, getUser } from "@/lib/firebase/users";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import InfoModal from "@/components/InfoModal";

export const dynamic = 'force-dynamic';

// 눈송이 컴포넌트
function Snowflake({ delay, duration, left, initialTop }: { delay: number; duration: number; left: number; initialTop: number }) {
  const size = Math.random() * 15 + 18; // 18-33px 크기
  
  // 눈송이 색상 변수 (한 곳에서 수정 가능)
  const snowflakeColor = "white"; // "white", "#E0F2FE", "#F0F0F0" 등으로 변경 가능
  
  // 색상에 따른 그림자 효과 (RGB 값 추출)
  const getShadowColor = (color: string) => {
    if (color === "white") return "rgba(255, 255, 255, 0.9)";
    if (color === "#E0F2FE") return "rgba(224, 242, 254, 0.9)";
    if (color === "#F0F0F0") return "rgba(240, 240, 240, 0.9)";
    // HEX 색상을 RGB로 변환
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.9)`;
  };
  
  return (
    <div
      className="absolute pointer-events-none select-none snowflake-mobile"
      style={{
        left: `${left}%`,
        top: `${initialTop}%`,
        animation: `snowfall ${duration}s linear ${delay}s infinite`,
        width: `${size}px`,
        height: `${size}px`,
        filter: `drop-shadow(0 0 3px ${getShadowColor(snowflakeColor)})`,
        opacity: 0.95,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 중앙 육각형 */}
        <polygon
          points="50,42 58,46 58,54 50,58 42,54 42,46"
          fill={snowflakeColor}
          stroke={snowflakeColor}
          strokeWidth="1"
        />
        
        {/* 6개의 주요 팔 (상하좌우 + 대각선) */}
        {/* 위쪽 팔 */}
        <line x1="50" y1="42" x2="50" y2="10" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="28" x2="44" y2="22" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="28" x2="56" y2="22" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="20" x2="46" y2="16" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="20" x2="54" y2="16" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        
        {/* 아래쪽 팔 */}
        <line x1="50" y1="58" x2="50" y2="90" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="72" x2="44" y2="78" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="72" x2="56" y2="78" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="80" x2="46" y2="84" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="80" x2="54" y2="84" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        
        {/* 왼쪽 팔 */}
        <line x1="42" y1="50" x2="10" y2="50" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="28" y1="50" x2="22" y2="44" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="28" y1="50" x2="22" y2="56" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="50" x2="16" y2="46" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="50" x2="16" y2="54" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        
        {/* 오른쪽 팔 */}
        <line x1="58" y1="50" x2="90" y2="50" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="72" y1="50" x2="78" y2="44" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="72" y1="50" x2="78" y2="56" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="50" x2="84" y2="46" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="80" y1="50" x2="84" y2="54" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        
        {/* 왼쪽 위 대각선 팔 */}
        <line x1="42" y1="42" x2="18" y2="18" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="30" x2="24" y2="24" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="30" x2="24" y2="36" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="30" x2="36" y2="24" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="22" y1="22" x2="19" y2="19" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="22" x2="19" y2="25" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="22" x2="25" y2="19" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        
        {/* 오른쪽 아래 대각선 팔 */}
        <line x1="58" y1="58" x2="82" y2="82" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="70" x2="76" y2="76" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="70" x2="76" y2="64" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="70" x2="64" y2="76" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="78" y1="78" x2="81" y2="81" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="78" y1="78" x2="81" y2="75" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="78" y1="78" x2="75" y2="81" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        
        {/* 오른쪽 위 대각선 팔 */}
        <line x1="58" y1="42" x2="82" y2="18" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="30" x2="76" y2="24" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="30" x2="76" y2="36" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="30" x2="64" y2="24" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="78" y1="22" x2="81" y2="19" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="78" y1="22" x2="81" y2="25" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="78" y1="22" x2="75" y2="19" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        
        {/* 왼쪽 아래 대각선 팔 */}
        <line x1="42" y1="58" x2="18" y2="82" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="70" x2="24" y2="76" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="70" x2="24" y2="64" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="70" x2="36" y2="76" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="22" y1="78" x2="19" y2="81" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="78" x2="19" y2="75" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="78" x2="25" y2="81" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
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

  // 데스크톱에서 메인 컨테이너만 스크롤 제거 (푸터는 보이도록)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        const isDesktop = window.innerWidth >= 768;
        const mainElement = document.querySelector('.main-page');
        if (mainElement && isDesktop) {
          // 메인 컨테이너만 overflow hidden
          (mainElement as HTMLElement).style.overflow = 'hidden';
        } else if (mainElement) {
          (mainElement as HTMLElement).style.overflow = '';
        }
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        const mainElement = document.querySelector('.main-page');
        if (mainElement) {
          (mainElement as HTMLElement).style.overflow = '';
        }
      };
    }
  }, []);

  return (
    <>
      {loading && <LoadingSpinner message="로그인 중..." />}
      <div className="main-page min-h-[calc(100vh-120px)] md:h-[calc(100vh-120px)] text-foreground flex items-center justify-center px-4 relative overflow-hidden">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-4">
            <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">약관 동의</h2>
              <div className="space-y-6 mb-6 text-sm md:text-base text-gray-700 max-h-[60vh] overflow-y-auto">
                {/* 서비스 이용약관 */}
                <section>
                  <h3 className="text-lg md:text-xl font-bold text-primary mb-3">제1조 (서비스 이용약관)</h3>
                  <div className="space-y-2 leading-relaxed">
                    <p><strong>1. 목적</strong></p>
                    <p className="ml-4">본 약관은 Rotape(이하 &quot;회사&quot;)가 제공하는 로테이션 소개팅 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                    
                    <p><strong>2. 서비스의 내용</strong></p>
                    <p className="ml-4">회사는 로테이션 소개팅 행사를 주최하고, 이용자가 행사에 참여할 수 있도록 지원서 접수 및 관리 서비스를 제공합니다.</p>
                    
                    <p><strong>3. 이용자의 의무</strong></p>
                    <ul className="ml-4 list-disc list-inside space-y-1">
                      <li>이용자는 본인의 실제 정보를 정확하게 제공해야 합니다.</li>
                      <li>타인의 정보를 도용하거나 허위 정보를 제공해서는 안 됩니다.</li>
                      <li>서비스 이용 중 다른 이용자에게 피해를 주는 행위를 해서는 안 됩니다.</li>
                      <li>행사 당일 무단 불참 시 향후 서비스 이용에 제한이 있을 수 있습니다.</li>
                    </ul>
                    
                    <p><strong>4. 회사의 권리와 의무</strong></p>
                    <ul className="ml-4 list-disc list-inside space-y-1">
                      <li>회사는 이용자의 지원서를 검토하고 승인/거절할 권리가 있습니다.</li>
                      <li>회사는 서비스의 원활한 운영을 위해 필요한 조치를 취할 수 있습니다.</li>
                      <li>부적절한 행위를 한 이용자에 대해서는 서비스 이용을 제한할 수 있습니다.</li>
                    </ul>
                  </div>
                </section>

                {/* 개인정보 처리방침 */}
                <section>
                  <h3 className="text-lg md:text-xl font-bold text-primary mb-3">제2조 (개인정보 처리방침)</h3>
                  <div className="space-y-2 leading-relaxed">
                    <p><strong>1. 수집하는 개인정보 항목</strong></p>
                    <ul className="ml-4 list-disc list-inside space-y-1">
                      <li>필수항목: 이름, 성별, 생년월일, 연락처, 프로필 사진, 직업, 자기소개, 이상형, 사랑의 언어</li>
                      <li>자동 수집 항목: IP 주소, 쿠키, 접속 로그, 기기 정보</li>
                    </ul>
                    
                    <p><strong>2. 개인정보의 수집 및 이용 목적</strong></p>
                    <ul className="ml-4 list-disc list-inside space-y-1">
                      <li>서비스 제공 및 행사 운영</li>
                      <li>이용자 식별 및 본인 확인</li>
                      <li>행사 참가자 매칭 및 관리</li>
                      <li>서비스 개선 및 신규 서비스 개발</li>
                    </ul>
                    
                    <p><strong>3. 개인정보의 보유 및 이용 기간</strong></p>
                    <p className="ml-4">회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 삭제합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
                    
                    <p><strong>4. 개인정보의 제3자 제공</strong></p>
                    <p className="ml-4">회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 행사 참가를 위해 동일 행사 참가자에게는 프로필 정보가 공개될 수 있습니다.</p>
                    
                    <p><strong>5. 개인정보의 파기</strong></p>
                    <p className="ml-4">회원 탈퇴 시 수집된 개인정보는 즉시 파기되며, 파기 절차 및 방법은 회사 내부 방침에 따릅니다.</p>
                  </div>
                </section>

                {/* 기타 */}
                <section>
                  <h3 className="text-lg md:text-xl font-bold text-primary mb-3">제3조 (기타)</h3>
                  <div className="space-y-2 leading-relaxed">
                    <p><strong>1. 약관의 변경</strong></p>
                    <p className="ml-4">본 약관은 관련 법령의 변경 또는 서비스 정책 변경에 따라 수정될 수 있으며, 변경 시 사전 공지합니다.</p>
                    
                    <p><strong>2. 분쟁 해결</strong></p>
                    <p className="ml-4">서비스 이용과 관련하여 발생한 분쟁은 대한민국 법률에 따라 해결합니다.</p>
                    
                    <p><strong>3. 연락처</strong></p>
                    <p className="ml-4">서비스 이용과 관련한 문의사항은 서비스 내 고객센터를 통해 문의해주세요.</p>
                  </div>
                </section>
              </div>
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowTerms(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-300"
                >
                  취소
                </button>
                <button
                  onClick={handleAcceptTerms}
                  className="flex-1 bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  동의
                </button>
              </div>
            </div>
          </div>
        )}
        <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      </div>
    </div>
    </>
  );
}

