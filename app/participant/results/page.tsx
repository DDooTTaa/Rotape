"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getMatchesForEvent } from "@/lib/firebase/matching";
import { getProfile } from "@/lib/firebase/profiles";
import { Match, Profile } from "@/lib/firebase/types";
import Image from "next/image";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function ResultsPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadResults();
    }
  }, [user]);

  const loadResults = async () => {
    if (!user) return;
    try {
      // 실제 eventId를 가져와야 함
      const eventId = "current-event-id";
      const matches = await getMatchesForEvent(eventId);
      const userMatch = matches.find(
        (m) => m.userA === user.uid || m.userB === user.uid
      );

      if (userMatch) {
        setMatch(userMatch);
        const otherUid = userMatch.userA === user.uid ? userMatch.userB : userMatch.userA;
        const profile = await getProfile(otherUid);
        setMatchedProfile(profile);
      }
    } catch (error) {
      console.error("결과 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth!);
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!match || !matchedProfile) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">매칭 결과</h1>
          <p className="text-gray-700 mb-6">
            아쉽게도 이번에는 매칭되지 않았습니다.
          </p>
          <p className="text-sm text-gray-600">
            다음 행사에 다시 참가해주세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">매칭 결과</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            로그아웃
          </button>
        </div>

        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">매칭된 이성</h2>
          {matchedProfile.photos[0] && (
            <div className="mb-4">
              <Image
                src={matchedProfile.photos[0]}
                alt="Profile"
                width={200}
                height={200}
                className="rounded-lg mx-auto"
              />
            </div>
          )}
          <p className="text-xl font-semibold mb-2 text-gray-800">{matchedProfile.displayName}</p>
          <p className="mb-2 text-gray-800">직업: {matchedProfile.job}</p>
          <p className="mb-4 text-gray-800">소개: {matchedProfile.intro}</p>
        </div>

        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">서로에게 남긴 메시지</h2>
          <p className="text-gray-700">메시지가 여기에 표시됩니다.</p>
        </div>

        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">채팅방</h2>
          <p className="text-gray-700 mb-4">
            24시간 동안 유지되는 채팅방이 생성되었습니다.
          </p>
          <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition">
            채팅하기
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-700 mb-4">행사가 종료되었습니다.</p>
          <a
            href="#"
            className="text-primary underline hover:opacity-90"
          >
            후기 설문 작성하기
          </a>
        </div>
      </div>
    </div>
  );
}

