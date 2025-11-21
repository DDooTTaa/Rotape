"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getAllLikesForEvent, calculateMatches, createMatch } from "@/lib/firebase/matching";
import { getProfile } from "@/lib/firebase/profiles";
import { Like, Match, Profile } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";

export default function MatchingPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [likes, setLikes] = useState<Like[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState("current-event-id");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, eventId]);

  const loadData = async () => {
    try {
      const likesData = await getAllLikesForEvent(eventId);
      setLikes(likesData);

      const matchesData = await calculateMatches(likesData);
      setMatches(matchesData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunMatching = async () => {
    if (!confirm("매칭 알고리즘을 실행하시겠습니까?")) return;

    setLoading(true);
    try {
      const calculatedMatches = calculateMatches(likes);

      // Firestore에 저장
      for (const match of calculatedMatches) {
        await createMatch(match.eventId, {
          userA: match.userA,
          userB: match.userB,
          score: match.score,
        });
      }

      setMatches(calculatedMatches);
      alert("매칭이 완료되었습니다.");
    } catch (error) {
      console.error("매칭 실행 실패:", error);
      alert("매칭 실행에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-foreground flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-foreground py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">매칭 결과 관리</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            로그아웃
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={handleRunMatching}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            매칭 알고리즘 실행
          </button>
        </div>

        {/* 선택 결과 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">참가자별 선택 결과</h2>
          <div className="space-y-4">
            {likes.map((like) => (
              <div key={like.uid} className="bg-white border border-primary/30 rounded-lg p-4">
                <p className="font-semibold mb-2">참가자 {like.uid}</p>
                <p className="text-sm">1순위: {like.first}</p>
                <p className="text-sm">2순위: {like.second}</p>
                <p className="text-sm">3순위: {like.third}</p>
                {like.message && <p className="text-sm mt-2">메시지: {like.message}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* 매칭 결과 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">매칭 결과</h2>
          <div className="space-y-4">
            {matches.length === 0 ? (
              <p className="text-gray-700">매칭 결과가 없습니다.</p>
            ) : (
              matches.map((match, index) => (
                <div key={index} className="bg-white border border-primary/30 rounded-lg p-4">
                  <p className="font-semibold mb-2">
                    커플 {index + 1}: {match.userA} ↔ {match.userB}
                  </p>
                  <p className="text-sm text-gray-700">매칭 점수: {match.score}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 킹왕짱 (Top 3) */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">인기 순위 (Top 3)</h2>
          <div className="space-y-4">
            {/* 실제로는 likes 데이터를 집계해서 계산해야 함 */}
            <p className="text-gray-700">인기 순위 계산 기능 구현 필요</p>
          </div>
        </div>
      </div>
    </div>
  );
}

