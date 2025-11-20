"use client";

import { useState } from "react";
import Link from "next/link";

export default function ParticipantLanding() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

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
  ];

  return (
    <div className="min-h-screen bg-deep-green text-foreground">
      {/* 헤더 */}
      <header className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center text-primary">Rotape</h1>
      </header>

      {/* 메인 섹션 */}
      <main className="container mx-auto px-4 py-12">
        {/* 서비스 소개 */}
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">로테이션 소개팅</h2>
          <p className="text-xl mb-8 text-gray-300">
            새로운 만남의 기회를 로테이션 방식으로 경험해보세요
          </p>
          <div className="bg-primary/20 rounded-lg p-6 mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-primary">참가 안내</h3>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              <li>• 연령: 만 20세 이상 40세 미만</li>
              <li>• 인원: 남성 10명, 여성 10명 (총 20명)</li>
              <li>• 조건: 미혼자</li>
            </ul>
          </div>
          <Link
            href="/participant/auth"
            className="inline-block bg-primary text-deep-green px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition"
          >
            지금 신청하기
          </Link>
        </section>

        {/* 지난 후기 캐러셀 */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold mb-6 text-center">지난 후기</h3>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-64 bg-primary/20 rounded-lg p-4"
              >
                <p className="text-sm mb-2">참가자 {i}</p>
                <p className="text-sm">
                  "정말 즐거운 시간이었어요! 좋은 만남이 있었습니다."
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h3 className="text-2xl font-bold mb-6 text-center">자주 묻는 질문</h3>
          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-primary/10 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full px-6 py-4 text-left font-semibold flex justify-between items-center"
                >
                  <span>{faq.question}</span>
                  <span>{faqOpen === index ? "−" : "+"}</span>
                </button>
                {faqOpen === index && (
                  <div className="px-6 py-4 bg-primary/5">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

