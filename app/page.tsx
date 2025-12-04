"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import InfoModal from "@/components/InfoModal";

export const dynamic = 'force-dynamic';

export default function Home() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const isScrolling = useRef(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // 가로 스크롤 처리 (데스크톱만)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // 모바일에서는 가로 스크롤 비활성화
      if (window.innerWidth < 768) return;
      
      if (isScrolling.current) return;

      e.preventDefault();
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

  // 스크롤 위치에 따라 현재 슬라이드 업데이트 (데스크톱만)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // 모바일에서 세로 스크롤 감지
      if (window.innerWidth < 768) {
        // 첫 페이지에서 벗어나면 스크롤 인디케이터 숨기기
        if (container.scrollTop > 50) {
          setShowScrollIndicator(false);
        } else {
          setShowScrollIndicator(true);
        }
        return;
      }
      
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


  useEffect(() => {
    // 랜딩 페이지 클래스 추가
    document.documentElement.classList.add('landing-page');
    document.body.classList.add('landing-page');
    
    return () => {
      // 컴포넌트 언마운트 시 클래스 제거
      document.documentElement.classList.remove('landing-page');
      document.body.classList.remove('landing-page');
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 md:overflow-hidden" style={{ overflow: 'auto' }}>
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

        {/* 가로 스크롤 컨테이너 */}
        <div
          ref={containerRef}
          className="horizontal-scroll-container w-full h-screen md:h-screen scrollbar-hide"
          style={{
            scrollBehavior: 'smooth',
            overflowX: 'auto',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex flex-col md:flex-row h-auto md:h-full">
            {/* 첫 번째 페이지: 로고와 소개 */}
            <section className="w-full md:w-screen flex-shrink-0 min-h-screen md:h-screen flex flex-col items-center justify-center snap-center relative z-10 px-4 py-12 md:py-8">
              <div className="text-center max-w-4xl w-full">
                <div className="flex justify-center mb-4 md:mb-6">
                  <Image
                    src="/logo.png"
                    alt="Rotape"
                    width={200}
                    height={80}
                    priority
                    className="h-auto w-auto max-w-[200px] md:max-w-[240px]"
                  />
        </div>
                <p className="text-gray-700 text-2xl md:text-4xl font-medium mb-8 md:mb-10 px-2 title-glow" style={{ fontFamily: "'Nanum Pen Script', cursive" }}>
                  한 컷의 테이프처럼 영원할 당신의 인연
                </p>
          <Link
                  href="/participant/auth"
                  className="btn-pulse btn-gradient-animated inline-block text-white px-8 py-4 md:px-14 md:py-6 rounded-xl md:rounded-2xl font-bold text-base md:text-xl hover:opacity-90 transition-all duration-300 shadow-xl md:shadow-2xl transform hover:-translate-y-1 md:hover:-translate-y-2"
          >
                  로그인하고 시작하기
          </Link>
              </div>
              
              {/* 모바일 스크롤 안내 애니메이션 */}
              {showScrollIndicator && (
                <div className="md:hidden absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-20 transition-opacity duration-300">
                  <p className="text-xs text-gray-500 font-medium scroll-text">아래로 스크롤</p>
                  <svg 
                    className="w-6 h-6 text-primary scroll-indicator" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                    />
                  </svg>
                </div>
              )}
            </section>

            {/* 두 번째 페이지: 우리만의 메리트 */}
            <section className="w-full md:w-screen flex-shrink-0 min-h-screen md:h-screen flex items-center justify-center snap-center relative z-10 px-4 md:px-16 py-12 md:py-8 bg-gradient-to-br from-primary/5 to-[#0d4a1a]/5">
              <div className="w-full max-w-7xl">
                <h2 className="title-glow text-3xl md:text-6xl font-bold mb-8 md:mb-12 text-center bg-gradient-to-r from-primary via-[#0d4a1a] to-primary bg-clip-text text-transparent px-2">
                  Values.
                </h2>
                <div className="space-y-8 md:space-y-12">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-primary to-[#0d4a1a] rounded-full flex items-center justify-center p-3 md:p-4 shadow-lg icon-animated-rotate">
                      <svg className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        Rotation Dating
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                        짧은 시간 안에 여러 이성과 만나<br />
                        인연을 찾아보세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-primary to-[#0d4a1a] rounded-full flex items-center justify-center p-3 md:p-4 shadow-lg icon-animated-pulse">
                      <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        Love Language
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                        사랑의 언어를 기반으로 서로의 가치를 이해하고<br />
                        당신과 통하는 인연을 만나보세요
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-primary to-[#0d4a1a] rounded-full flex items-center justify-center p-3 md:p-4 shadow-lg icon-animated-bounce">
                      <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        Special Experience
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                        한번의 만남을 넘어 영화 테이프처럼 <br />
                        영원히 기억될 만남을 만들어 보세요. 저희가 도와드릴게요!
                      </p>
                    </div>
                  </div>
                </div>
                  </div>
                </section>

            {/* 세 번째 페이지: 재미 요소 */}
            <section className="w-full md:w-screen flex-shrink-0 min-h-screen md:h-screen flex items-center justify-center snap-center relative z-10 px-4 md:px-16 py-12 md:py-8 bg-gradient-to-br from-primary/5 to-[#0d4a1a]/5">
              <div className="w-full max-w-7xl">
                <h2 className="title-glow text-3xl md:text-6xl font-bold mb-8 md:mb-12 text-center bg-gradient-to-r from-primary via-[#0d4a1a] to-primary bg-clip-text text-transparent px-2">
                  Features.
                </h2>
                <div className="space-y-8 md:space-y-12">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-primary to-[#0d4a1a] rounded-full flex items-center justify-center p-3 md:p-4 shadow-lg icon-animated-rotate">
                      <svg className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        Mood.
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                        프리미엄 다과와 음료와 함께 <br />
                        편안한 환경 속에서 즐겁게 대화해 보세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-primary to-[#0d4a1a] rounded-full flex items-center justify-center p-3 md:p-4 shadow-lg icon-animated-float">
                      <svg className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        Message.
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                        궁금한 이성에게 쪽지를 보내보세요.<br />
                        전화번호 교환 없이 가능해요.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-primary to-[#0d4a1a] rounded-full flex items-center justify-center p-3 md:p-4 shadow-lg icon-animated-bounce">
                      <svg className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        Matching.
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                       서로에게 호감이 있다면 그 마음을<br />
                      이어갈 수 있도록 도와드릴게요.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 네 번째 페이지: 우리가 지향하는 메시지 */}
            <section className="w-full md:w-screen flex-shrink-0 min-h-screen md:h-screen flex items-center justify-center snap-center relative z-10 px-4 md:px-16 py-12 md:py-8">
              <div className="w-full max-w-5xl text-center">
                <div className="space-y-4 md:space-y-6 lg:space-y-8">
                  <p className="title-glow text-2xl md:text-5xl font-bold text-gray-800 leading-relaxed px-2">
                    수많은 순간 속<br />
                    <span className="text-primary">한 컷의 인연</span>을<br />
                    테이프처럼
                  </p>
                  <p className="text-lg md:text-3xl text-gray-600 mt-4 md:mt-6 leading-relaxed px-2">
                    영화 테이프가 여러 순간을 담듯<br />
                    이번 만남을 통해 <span className="font-bold text-primary">인연</span>을 찾으세요.
                  </p>
                </div>
                <div className="mt-8 md:mt-12">
                  <Link
                    href="/participant/auth"
                    className="btn-pulse btn-gradient-animated inline-block text-white px-8 py-4 md:px-14 md:py-6 rounded-xl md:rounded-2xl font-bold text-base md:text-xl hover:opacity-90 transition-all duration-300 shadow-xl md:shadow-2xl transform hover:-translate-y-1 md:hover:-translate-y-2"
                >
                    지금 바로 시작하기
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 페이지 인디케이터 (데스크톱만) */}
        <div className="hidden md:flex fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 gap-2">
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
              className={`w-3 h-3 rounded-full transition-all ${currentSlide === index
                ? 'bg-primary w-8'
                : 'bg-gray-300 hover:bg-gray-400'
                }`}
              aria-label={`페이지 ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </>
  );
}
