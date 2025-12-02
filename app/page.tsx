"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import InfoModal from "@/components/InfoModal";

export const dynamic = 'force-dynamic';

// 눈송이 컴포넌트
function Snowflake({ delay, duration, left, initialTop }: { delay: number; duration: number; left: number; initialTop: number }) {
  const size = Math.random() * 15 + 18; // 18-33px 크기
  const snowflakeColor = "white";
  
  const getShadowColor = (color: string) => {
    if (color === "white") return "rgba(255, 255, 255, 0.9)";
    if (color === "#E0F2FE") return "rgba(224, 242, 254, 0.9)";
    if (color === "#F0F0F0") return "rgba(240, 240, 240, 0.9)";
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
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.8 }}
      >
        <polygon points="50,42 58,46 58,54 50,58 42,54 42,46" fill={snowflakeColor} stroke={snowflakeColor} strokeWidth="1" />
        <line x1="50" y1="42" x2="50" y2="10" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="28" x2="44" y2="22" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="28" x2="56" y2="22" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="20" x2="46" y2="16" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="20" x2="54" y2="16" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="58" x2="50" y2="90" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="72" x2="44" y2="78" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="72" x2="56" y2="78" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="80" x2="46" y2="84" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="80" x2="54" y2="84" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1="50" x2="10" y2="50" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="28" y1="50" x2="22" y2="44" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="28" y1="50" x2="22" y2="56" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="50" x2="16" y2="46" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="50" x2="16" y2="54" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="58" y1="50" x2="90" y2="50" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="72" y1="50" x2="78" y2="44" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="72" y1="50" x2="78" y2="56" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="50" x2="84" y2="46" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="80" y1="50" x2="84" y2="54" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1="42" x2="18" y2="18" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="30" x2="24" y2="24" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="30" x2="24" y2="36" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="30" x2="36" y2="24" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="22" y1="22" x2="19" y2="19" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="22" x2="19" y2="25" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="22" x2="25" y2="19" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="58" y1="58" x2="82" y2="82" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="70" x2="76" y2="76" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="70" x2="76" y2="64" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="70" x2="64" y2="76" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="78" y1="78" x2="81" y2="81" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="78" y1="78" x2="81" y2="75" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="78" y1="78" x2="75" y2="81" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="58" y1="42" x2="82" y2="18" stroke={snowflakeColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="30" x2="76" y2="24" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="30" x2="76" y2="36" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="30" x2="64" y2="24" stroke={snowflakeColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="78" y1="22" x2="81" y2="19" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="78" y1="22" x2="81" y2="25" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="78" y1="22" x2="75" y2="19" stroke={snowflakeColor} strokeWidth="2.5" strokeLinecap="round" />
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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // 눈송이 생성
  const snowflakes = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    duration: Math.random() * 5 + 8,
    left: Math.random() * 100,
    initialTop: Math.random() * -100,
  }));

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (isScrolling.current) return;
      
      const delta = e.deltaY > 0 ? 1 : -1;
      const newSlide = Math.max(0, Math.min(3, currentSlide + delta));
      
      if (newSlide !== currentSlide) {
        isScrolling.current = true;
        setCurrentSlide(newSlide);
        
        const slideWidth = window.innerWidth;
        container.scrollTo({
          left: newSlide * slideWidth,
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          isScrolling.current = false;
        }, 500);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [currentSlide]);

  // 스크롤 위치에 따라 현재 슬라이드 업데이트
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const slideWidth = window.innerWidth;
      const newSlide = Math.round(container.scrollLeft / slideWidth);
      if (newSlide !== currentSlide) {
        setCurrentSlide(newSlide);
      }
    };

    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [currentSlide]);

  return (
    <>
      <div className="main-page min-h-screen text-foreground relative overflow-hidden">

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

        {/* 인디케이터 */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              onClick={() => {
                const container = containerRef.current;
                if (container) {
                  const slideWidth = window.innerWidth;
                  container.scrollTo({
                    left: index * slideWidth,
                    behavior: 'smooth'
                  });
                  setCurrentSlide(index);
                }
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? 'bg-primary w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`슬라이드 ${index + 1}`}
            />
          ))}
        </div>

        {/* 수평 스크롤 컨테이너 */}
        <div
          ref={containerRef}
          className="flex overflow-x-scroll snap-x snap-mandatory h-screen horizontal-scroll-container"
        >
          {/* 첫 번째 페이지: 로고, 간단한 설명, 로그인 버튼 */}
          <section className="min-w-full h-screen flex items-center justify-center snap-center relative z-10 px-4">
            <div className="text-center max-w-2xl">
              <div className="flex justify-center mb-8">
                <Image
                  src="/logo.png"
                  alt="Rotape"
                  width={280}
                  height={112}
                  priority
                  className="h-auto drop-shadow-2xl"
                />
              </div>
              <p className="text-gray-700 text-2xl md:text-4xl font-medium mb-8" style={{ fontFamily: "'Nanum Pen Script', cursive" }}>
                한 컷의 테이프처럼 영원할 당신의 인연
              </p>
              <p className="text-gray-600 text-lg md:text-xl mb-12">
                로테이션 소개팅으로 특별한 만남을 경험해보세요
              </p>
              <Link
                href="/participant/auth"
                className="inline-block bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-12 py-6 md:px-16 md:py-7 rounded-xl font-bold text-xl md:text-2xl hover:opacity-90 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                로그인하고 시작하기
              </Link>
            </div>
          </section>

          {/* 두 번째 페이지: 특징 */}
          <section className="min-w-full h-screen flex items-center justify-center snap-center relative z-10 px-4">
            <div className="max-w-5xl w-full">
              <h2 className="text-3xl md:text-5xl font-bold mb-12 md:mb-16 text-center text-primary">
                서비스 특징
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/95 backdrop-blur-md border-2 border-primary/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  <div className="text-6xl mb-6 text-center">🎯</div>
                  <h3 className="text-2xl font-bold mb-4 text-center text-primary">체계적인 매칭</h3>
                  <p className="text-gray-700 text-center leading-relaxed">
                    로테이션 방식으로 모든 참가자와 만나 최적의 매칭을 찾아드립니다.
                  </p>
                </div>
                <div className="bg-white/95 backdrop-blur-md border-2 border-primary/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  <div className="text-6xl mb-6 text-center">💝</div>
                  <h3 className="text-2xl font-bold mb-4 text-center text-primary">진정한 만남</h3>
                  <p className="text-gray-700 text-center leading-relaxed">
                    진심으로 만나고 싶은 사람을 찾을 수 있는 기회를 제공합니다.
                  </p>
                </div>
                <div className="bg-white/95 backdrop-blur-md border-2 border-primary/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  <div className="text-6xl mb-6 text-center">✨</div>
                  <h3 className="text-2xl font-bold mb-4 text-center text-primary">특별한 경험</h3>
                  <p className="text-gray-700 text-center leading-relaxed">
                    평범한 소개팅을 넘어선 특별한 만남의 경험을 선사합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 세 번째 페이지: 프로세스 */}
          <section className="min-w-full h-screen flex items-center justify-center snap-center relative z-10 px-4">
            <div className="max-w-5xl w-full">
              <h2 className="text-3xl md:text-5xl font-bold mb-12 md:mb-16 text-center text-primary">
                참가 프로세스
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  { step: "01", title: "회원가입", desc: "간편하게 가입하고 프로필을 작성하세요", icon: "📝" },
                  { step: "02", title: "행사 신청", desc: "원하는 행사에 지원하고 승인을 기다리세요", icon: "📅" },
                  { step: "03", title: "로테이션", desc: "모든 참가자와 순차적으로 만나 대화하세요", icon: "💬" },
                  { step: "04", title: "매칭 결과", desc: "서로 선택한 상대와 연락처를 공유받으세요", icon: "💕" },
                ].map((item, index) => (
                  <div key={index} className="relative">
                    <div className="bg-white/95 backdrop-blur-md border-2 border-primary/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-center">
                      <div className="text-5xl mb-4">{item.icon}</div>
                      <div className="text-sm font-bold text-primary mb-2">{item.step}</div>
                      <h4 className="text-xl font-bold mb-2 text-gray-800">{item.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                    {index < 3 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary text-2xl">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 네 번째 페이지: 캐치프라이즈와 로그인 버튼 */}
          <section className="min-w-full h-screen flex items-center justify-center snap-center relative z-10 px-4">
            <div className="text-center max-w-3xl">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-[#0d4a1a] to-primary bg-clip-text text-transparent">
                지금 바로 시작하세요
              </h2>
              <p className="text-gray-700 text-xl md:text-2xl mb-4" style={{ fontFamily: "'Nanum Pen Script', cursive" }}>
                특별한 만남을 찾기 위한 첫 걸음을 내딛어보세요
              </p>
              <p className="text-gray-600 text-lg md:text-xl mb-12">
                로테이션 소개팅으로 새로운 인연을 만나보세요
              </p>
              <Link
                href="/participant/auth"
                className="inline-block bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-12 py-6 md:px-16 md:py-7 rounded-2xl font-bold text-xl md:text-2xl hover:opacity-90 transition-all duration-300 shadow-2xl hover:shadow-2xl transform hover:-translate-y-2"
              >
                <span className="flex items-center justify-center gap-3">
                  로그인하고 시작하기
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            </div>
          </section>
        </div>
      </div>
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </>
  );
}
