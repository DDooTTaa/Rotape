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

  // 가로 스크롤 처리
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
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

  // 터치 스와이프 처리 (모바일)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (!touchStartX.current || !touchEndX.current) return;
      
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;

      if (Math.abs(distance) > minSwipeDistance) {
        if (distance > 0 && currentSlide < 3) {
          // Swipe left - next slide
          const newSlide = currentSlide + 1;
          setCurrentSlide(newSlide);
          const slideWidth = window.innerWidth;
          container.scrollTo({
            left: newSlide * slideWidth,
            behavior: 'smooth'
          });
        } else if (distance < 0 && currentSlide > 0) {
          // Swipe right - previous slide
          const newSlide = currentSlide - 1;
          setCurrentSlide(newSlide);
          const slideWidth = window.innerWidth;
          container.scrollTo({
            left: newSlide * slideWidth,
            behavior: 'smooth'
          });
        }
      }

      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentSlide]);

  return (
    <>
      <div className="fixed inset-0 overflow-hidden" style={{ overflow: 'hidden' }}>
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
          className="horizontal-scroll-container w-full h-screen scrollbar-hide"
          style={{
            scrollBehavior: 'smooth',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex h-full">
            {/* 첫 번째 페이지: 로고와 소개 */}
            <section className="w-screen flex-shrink-0 h-screen flex flex-col items-center justify-center snap-center relative z-10 px-4 py-8 overflow-y-auto">
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
                <p className="text-gray-700 text-xl md:text-4xl font-medium mb-8 md:mb-10 px-2" style={{ fontFamily: "'Nanum Pen Script', cursive" }}>
                  한 컷의 테이프처럼 영원할 당신의 인연
                </p>
                <Link
                  href="/participant/auth"
                  className="inline-block bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-8 py-4 md:px-14 md:py-6 rounded-xl md:rounded-2xl font-bold text-base md:text-xl hover:opacity-90 transition-all duration-300 shadow-xl md:shadow-2xl transform hover:-translate-y-1 md:hover:-translate-y-2"
                >
                  로그인하고 시작하기
                </Link>
              </div>
            </section>

            {/* 두 번째 페이지: 우리만의 메리트 */}
            <section className="w-screen flex-shrink-0 h-screen flex items-center justify-center snap-center relative z-10 px-4 md:px-16 py-8 bg-gradient-to-br from-primary/5 to-[#0d4a1a]/5 overflow-y-auto">
              <div className="w-full max-w-7xl">
                <h2 className="text-3xl md:text-6xl font-bold mb-8 md:mb-12 text-center bg-gradient-to-r from-primary via-[#0d4a1a] to-primary bg-clip-text text-transparent px-2">
                  우리의 가치
                </h2>
                <div className="space-y-8 md:space-y-12">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="text-5xl md:text-7xl font-black text-primary flex-shrink-0">1</div>
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
                    <div className="text-5xl md:text-7xl font-black text-primary flex-shrink-0">2</div>
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
                    <div className="text-5xl md:text-7xl font-black text-primary flex-shrink-0">3</div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        Special Experience
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                        한번의 만남을 넘어<br />
                        영화 테이프처럼 영원히 기억될 만남
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 세 번째 페이지: 재미 요소 */}
            <section className="w-screen flex-shrink-0 h-screen flex items-center justify-center snap-center relative z-10 px-4 md:px-16 py-8 bg-gradient-to-br from-primary/5 to-[#0d4a1a]/5 overflow-y-auto">
              <div className="w-full max-w-7xl">
                <h2 className="text-3xl md:text-6xl font-bold mb-8 md:mb-12 text-center bg-gradient-to-r from-primary via-[#0d4a1a] to-primary bg-clip-text text-transparent px-2">
                  따끈따끈한 기능
                </h2>
                <div className="space-y-8 md:space-y-12">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="text-5xl md:text-7xl font-black text-primary flex-shrink-0">1</div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        분위기.
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                        편안한 환경 속에서 즐겁게 <br />
                        대화해 보세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="text-5xl md:text-7xl font-black text-primary flex-shrink-0">2</div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        쪽지.
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                        궁금한 이성에게<br />
                        쪽지를 보내보세요. 저희가 도와드릴게요.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                    <div className="text-5xl md:text-7xl font-black text-primary flex-shrink-0">3</div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-3">
                        매칭.
                      </p>
                      <p className="text-lg md:text-2xl text-gray-600 leading-relaxed">
                        영화 테이프처럼 소중한 순간들을<br />
                        하나씩 담아가는 특별한 경험
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 네 번째 페이지: 우리가 지향하는 메시지 */}
            <section className="w-screen flex-shrink-0 h-screen flex items-center justify-center snap-center relative z-10 px-4 md:px-16 py-8 overflow-y-auto">
              <div className="w-full max-w-5xl text-center">
                <div className="space-y-4 md:space-y-6 lg:space-y-8">
                  <p className="text-2xl md:text-5xl font-bold text-gray-800 leading-relaxed px-2">
                    수많은 순간 속<br />
                    <span className="text-primary">한 컷의 인연</span>을<br />
                    테이프처럼
                  </p>
                  <p className="text-lg md:text-3xl text-gray-600 mt-4 md:mt-6 leading-relaxed px-2">
                    영화 테이프가 여러 순간을 담아낼 수 있듯이<br />
                    여러 사람과의 만남을 통해<br />
                    <span className="font-bold text-primary">인연</span>을 찾을 수 있도록 도와 드릴게요!
                  </p>
                </div>
                <div className="mt-8 md:mt-12">
                  <Link
                    href="/participant/auth"
                    className="inline-block bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-8 py-4 md:px-14 md:py-6 rounded-xl md:rounded-2xl font-bold text-base md:text-xl hover:opacity-90 transition-all duration-300 shadow-xl md:shadow-2xl transform hover:-translate-y-1 md:hover:-translate-y-2"
                  >
                    지금 바로 시작하기
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 페이지 인디케이터 */}
        <div className="fixed bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
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
