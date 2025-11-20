"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getProfile } from "@/lib/firebase/profiles";
import { getEvent } from "@/lib/firebase/events";
import { Profile, Event } from "@/lib/firebase/types";
import Image from "next/image";

export default function ApprovedPage() {
  const [user] = useAuthState(auth);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-green text-foreground flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-deep-green text-foreground flex items-center justify-center">
        <p>프로필을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-green text-foreground py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">승인 완료</h1>

        <div className="bg-primary/20 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">프로필 확정</h2>
          <p className="mb-2">이름: {profile.displayName}</p>
          <p className="mb-2">직업: {profile.job}</p>
          <p className="mb-4">소개: {profile.intro}</p>
          <button className="bg-primary text-deep-green px-4 py-2 rounded-lg font-semibold">
            프로필 수정하기
          </button>
        </div>

        {event && (
          <div className="bg-primary/20 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">행사 안내</h2>
            <p className="mb-2">일시: {new Date(event.date).toLocaleString("ko-KR")}</p>
            <p className="mb-2">장소: {event.location}</p>
            {event.schedule.intro && <p className="mb-2">인트로: {event.schedule.intro}</p>}
            {event.schedule.part1 && <p className="mb-2">1부: {event.schedule.part1}</p>}
            {event.schedule.part2 && <p className="mb-2">2부: {event.schedule.part2}</p>}
          </div>
        )}

        <div className="bg-primary/20 rounded-lg p-6">
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
          <p className="text-sm text-center text-gray-300">
            행사 당일 이 QR 코드를 제시해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

