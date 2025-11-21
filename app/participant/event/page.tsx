"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getProfile } from "@/lib/firebase/profiles";
import { Profile } from "@/lib/firebase/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function EventPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [showIcebreaker, setShowIcebreaker] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profileData = await getProfile(user.uid);
      setProfile(profileData);
    } catch (error) {
      console.error("프로필 로드 실패:", error);
    }
  };


  const randomQuestions = [
    "가장 좋아하는 여행지는?",
    "스트레스를 받을 때 어떻게 해소하나요?",
    "이상적인 주말은?",
  ];

  const balanceGames = [
    { left: "집에서 쉬기", right: "밖에서 활동하기" },
    { left: "조용한 카페", right: "시끌벅적한 바" },
    { left: "계획적인 여행", right: "즉흥적인 여행" },
  ];

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-4 pb-8 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">행사 대시보드</h1>
        </div>

        {/* 타임라인 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">오늘 일정</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
              <div>
                <p className="font-semibold text-gray-800">인트로 (14:00)</p>
                <p className="text-sm text-gray-600">행사 소개 및 안내</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
              <div>
                <p className="font-semibold text-gray-800">1부 로테이션 (14:30)</p>
                <p className="text-sm text-gray-600">라운드 1-3</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-4"></div>
              <div>
                <p className="font-semibold text-gray-800">쉬는 시간 (16:00)</p>
                <p className="text-sm text-gray-600">15분 휴식</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-4"></div>
              <div>
                <p className="font-semibold text-gray-800">2부 로테이션 (16:15)</p>
                <p className="text-sm text-gray-600">라운드 4-6</p>
              </div>
            </div>
          </div>
        </div>

        {/* 현재 라운드 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">현재 라운드</h2>
          <p className="text-3xl font-bold mb-2 text-gray-800">라운드 {currentRound}</p>
          <p className="text-gray-600 mb-4">다음 라운드까지 약 10분 남았습니다.</p>
          <Link
            href="/participant/rotation"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            라운드 종료 후 선택하기
          </Link>
        </div>

        {/* 아이스브레이킹 툴 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">아이스브레이킹</h2>
          <div className="space-y-4">
            <button
              onClick={() => setShowIcebreaker(!showIcebreaker)}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {showIcebreaker ? "숨기기" : "랜덤 질문 보기"}
            </button>
            {showIcebreaker && (
              <div className="mt-4 space-y-4">
                <div className="bg-white border-2 border-primary rounded-lg p-4">
                  <p className="font-semibold mb-2 text-gray-800">랜덤 질문:</p>
                  <p className="text-gray-700">{randomQuestions[Math.floor(Math.random() * randomQuestions.length)]}</p>
                </div>
                <div className="bg-white border-2 border-primary rounded-lg p-4">
                  <p className="font-semibold mb-2 text-gray-800">밸런스 게임:</p>
                  {balanceGames[Math.floor(Math.random() * balanceGames.length)] && (
                    <div className="flex justify-between text-gray-700">
                      <span>{balanceGames[Math.floor(Math.random() * balanceGames.length)].left}</span>
                      <span className="text-primary font-bold">VS</span>
                      <span>{balanceGames[Math.floor(Math.random() * balanceGames.length)].right}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 프로필 카드 보기 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">프로필 카드</h2>
          <div className="space-y-4">
            <Link
              href="/participant/profile/view"
              className="block bg-primary text-white px-6 py-3 rounded-lg font-semibold text-center hover:opacity-90 transition"
            >
              QR 스캔하여 상대 프로필 조회
            </Link>
            <Link
              href="/participant/profile/my"
              className="block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-300 transition"
            >
              본인 프로필 재확인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

