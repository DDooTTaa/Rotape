"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getProfilesByEvent } from "@/lib/firebase/profiles";
import { submitLike, getLike } from "@/lib/firebase/matching";
import { getUser } from "@/lib/firebase/users";
import { Profile } from "@/lib/firebase/types";

export const dynamic = 'force-dynamic';

export default function RotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user] = useAuthState(auth!);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<"M" | "F" | null>(null);
  
  const [selections, setSelections] = useState({
    first: "",
    second: "",
    third: "",
    message: "",
    isAnonymous: false,
  });

  useEffect(() => {
    const eventIdParam = searchParams.get("eventId");
    if (eventIdParam) {
      setEventId(eventIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && eventId) {
      loadUserData();
      loadProfiles();
      checkExistingLike();
    }
  }, [user, eventId]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const userData = await getUser(user.uid);
      if (userData?.gender) {
        setUserGender(userData.gender);
      }
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);
    }
  };

  const checkExistingLike = async () => {
    if (!user || !eventId) return;
    try {
      const existingLike = await getLike(user.uid, eventId);
      if (existingLike) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("기존 투표 확인 실패:", error);
    }
  };

  const loadProfiles = async () => {
    if (!user || !eventId || !userGender) return;
    try {
      const profilesData = await getProfilesByEvent(eventId);
      
      // 이성 프로필만 필터링
      const profilesWithGender = await Promise.all(
        profilesData.map(async (p) => {
          try {
            const profileUser = await getUser(p.uid);
            return { profile: p, gender: profileUser?.gender };
          } catch {
            return { profile: p, gender: null };
          }
        })
      );
      
      const otherGenderProfiles = profilesWithGender
        .filter(({ gender, profile }) => gender && gender !== userGender && profile.uid !== user?.uid)
        .map(({ profile }) => profile);
      
      setProfiles(otherGenderProfiles);
    } catch (error) {
      console.error("프로필 로드 실패:", error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eventId) return;

    if (!selections.first || !selections.second || !selections.third) {
      alert("1, 2, 3순위를 모두 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      await submitLike(user.uid, eventId, {
        first: selections.first,
        second: selections.second,
        third: selections.third,
        message: selections.message,
      });

      setSubmitted(true);
    } catch (error) {
      console.error("제출 실패:", error);
      alert("제출에 실패했습니다.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="text-6xl mb-4 text-primary">✓</div>
            <h1 className="text-3xl font-bold mb-4">제출 완료</h1>
            <p className="text-gray-700 mb-6">
              선택이 완료되었습니다. 다음 라운드를 준비해주세요.
            </p>
            <button
              onClick={() => router.push("/participant/events")}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              행사 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">1, 2, 3순위 선택하기</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1순위 */}
          <div>
            <label className="block mb-2 font-semibold text-gray-800">1순위</label>
            <select
              required
              value={selections.first}
              onChange={(e) => setSelections({ ...selections, first: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
            >
              <option value="">선택하세요</option>
              {profiles.map((profile) => (
                <option key={profile.uid} value={profile.uid}>
                  {profile.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* 2순위 */}
          <div>
            <label className="block mb-2 font-semibold text-gray-800">2순위</label>
            <select
              required
              value={selections.second}
              onChange={(e) => setSelections({ ...selections, second: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
            >
              <option value="">선택하세요</option>
              {profiles
                .filter((p) => p.uid !== selections.first)
                .map((profile) => (
                  <option key={profile.uid} value={profile.uid}>
                    {profile.displayName}
                  </option>
                ))}
            </select>
          </div>

          {/* 3순위 */}
          <div>
            <label className="block mb-2 font-semibold text-gray-800">3순위</label>
            <select
              required
              value={selections.third}
              onChange={(e) => setSelections({ ...selections, third: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
            >
              <option value="">선택하세요</option>
              {profiles
                .filter((p) => p.uid !== selections.first && p.uid !== selections.second)
                .map((profile) => (
                  <option key={profile.uid} value={profile.uid}>
                    {profile.displayName}
                  </option>
                ))}
            </select>
          </div>

          {/* 하고 싶은 말 */}
          <div>
            <label className="block mb-2 font-semibold text-gray-800">하고 싶은 말</label>
            <textarea
              value={selections.message}
              onChange={(e) => setSelections({ ...selections, message: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
              rows={3}
              placeholder="메시지를 입력하세요 (선택사항)"
            />
            <label className="flex items-center mt-2 text-gray-800">
              <input
                type="checkbox"
                checked={selections.isAnonymous}
                onChange={(e) => setSelections({ ...selections, isAnonymous: e.target.checked })}
                className="mr-2"
              />
              익명으로 공개
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-6 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "제출 중..." : "제출하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

