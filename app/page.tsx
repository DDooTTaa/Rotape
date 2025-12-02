"use client";

import { useState } from "react";
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
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // 눈송이 생성
  const snowflakes = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    duration: Math.random() * 5 + 8,
    left: Math.random() * 100,
    initialTop: Math.random() * -100,
  }));

  const faqs = [
    {
      question: "참가 연령 제한이 있나요?",
      answer: "만 20세 이상 40세 미만 분들만 참가 가능합니다.",
    },
    {
      question: "참가 인원은 몇 명인가요?",
      answer: "남성 10명, 여성 10명 총 20명으로 진행됩니다.",
    },
    {
      question: "참가비는 얼마인가요?",
      answer: "행사 참가비는 별도로 안내드립니다.",
    },
    {
      question: "어떤 방식으로 진행되나요?",
      answer: "로테이션 방식으로 진행되며, 모든 참가자와 순차적으로 만나 대화할 수 있습니다.",
    },
  ];

  return (
    <>
      <div className="main-page min-h-screen text-foreground relative overflow-hidden">
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

        <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
          {/* 헤더 */}
          <header className="text-center mb-12 md:mb-16">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="Rotape"
                width={250}
                height={100}
                priority
                className="h-auto"
              />
            </div>
            <p className="text-gray-700 text-2xl md:text-[32px] font-medium" style={{ fontFamily: "'Nanum Pen Script', cursive" }}>
              한 컷의 테이프처럼 영원할 당신의 인연
            </p>
          </header>

          {/* 메인 섹션 */}
          <main className="max-w-4xl mx-auto">


            {/* 서비스 특징 */}
            <section className="mb-16 md:mb-20">
              <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center text-primary">서비스 특징</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/90 backdrop-blur-sm border-2 border-primary rounded-xl p-6 shadow-lg">
                  <div className="text-4xl mb-4 text-center">🎯</div>
                  <h4 className="text-xl font-semibold mb-2 text-center text-primary">체계적인 매칭</h4>
                  <p className="text-gray-700 text-center">
                    로테이션 방식으로 모든 참가자와 만나 최적의 매칭을 찾아드립니다.
                  </p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm border-2 border-primary rounded-xl p-6 shadow-lg">
                  <div className="text-4xl mb-4 text-center">💝</div>
                  <h4 className="text-xl font-semibold mb-2 text-center text-primary">진정한 만남</h4>
                  <p className="text-gray-700 text-center">
                    진심으로 만나고 싶은 사람을 찾을 수 있는 기회를 제공합니다.
                  </p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm border-2 border-primary rounded-xl p-6 shadow-lg">
                  <div className="text-4xl mb-4 text-center">✨</div>
                  <h4 className="text-xl font-semibold mb-2 text-center text-primary">특별한 경험</h4>
                  <p className="text-gray-700 text-center">
                    평범한 소개팅을 넘어선 특별한 만남의 경험을 선사합니다.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA 버튼 */}
            <section className="text-center mb-12">
              <Link
                href="/participant/auth"
                className="inline-block bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-10 py-5 md:px-14 md:py-6 rounded-xl font-bold text-xl md:text-2xl hover:opacity-90 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                로그인하고 시작하기
              </Link>
            </section>
          </main>
        </div>
      </div>
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </>
  );
}
