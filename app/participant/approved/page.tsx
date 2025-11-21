"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getProfile } from "@/lib/firebase/profiles";
import { getEvent } from "@/lib/firebase/events";
import { Profile, Event } from "@/lib/firebase/types";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ApprovedPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const profileData = await getProfile(user.uid);
      if (profileData) {
        setProfile(profileData);
        const eventData = await getEvent(profileData.eventId);
        setEvent(eventData);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <p>프로필을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">승인 완료</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            로그아웃
          </button>
        </div>

        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">프로필 확정</h2>
          <p className="mb-2 text-gray-800">이름: {profile.displayName}</p>
          <p className="mb-2 text-gray-800">직업: {profile.job}</p>
          <p className="mb-4 text-gray-800">소개: {profile.intro}</p>
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition">
            프로필 수정하기
          </button>
        </div>

        {event && (
          <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">행사 안내</h2>
            <p className="mb-2 text-gray-800">일시: {new Date(event.date).toLocaleString("ko-KR")}</p>
            <p className="mb-2 text-gray-800">장소: {event.location}</p>
            {event.schedule.intro && <p className="mb-2 text-gray-800">인트로: {event.schedule.intro}</p>}
            {event.schedule.part1 && <p className="mb-2 text-gray-800">1부: {event.schedule.part1}</p>}
            {event.schedule.part2 && <p className="mb-2 text-gray-800">2부: {event.schedule.part2}</p>}
          </div>
        )}

        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">입장용 QR 코드</h2>
          {profile.qrCode && (
            <div className="flex justify-center mb-4">
              <Image
                src={profile.qrCode}
                alt="QR Code"
                width={200}
                height={200}
                className="bg-white p-4 rounded-lg"
              />
            </div>
          )}
          <p className="text-sm text-center text-gray-600">
            행사 당일 이 QR 코드를 제시해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

