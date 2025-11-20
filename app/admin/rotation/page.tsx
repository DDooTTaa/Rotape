"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getRoundsByEvent, createRound, endRound } from "@/lib/firebase/rounds";
import { getProfilesByEvent } from "@/lib/firebase/profiles";
import { Round, Profile } from "@/lib/firebase/types";

export default function RotationPage() {
  const [user] = useAuthState(auth);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [eventId, setEventId] = useState("current-event-id");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, eventId]);

  const loadData = async () => {
    try {
      const roundsData = await getRoundsByEvent(eventId);
      setRounds(roundsData);

      const profilesData = await getProfilesByEvent(eventId);
      setProfiles(profilesData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    }
  };

  const handleStartRound = async () => {
    setLoading(true);
    try {
      await createRound({
        eventId,
        roundNumber: currentRound,
        participants: profiles.map(p => p.uid),
        startTime: new Date(),
      });
      await loadData();
      alert(`라운드 ${currentRound}가 시작되었습니다.`);
    } catch (error) {
      console.error("라운드 시작 실패:", error);
      alert("라운드 시작에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEndRound = async () => {
    setLoading(true);
    try {
      await endRound(eventId, currentRound);
      await loadData();
      setCurrentRound(currentRound + 1);
      alert(`라운드 ${currentRound}가 종료되었습니다.`);
    } catch (error) {
      console.error("라운드 종료 실패:", error);
      alert("라운드 종료에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-green text-foreground py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">로테이션 진행</h1>

        <div className="bg-primary/20 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">현재 라운드</h2>
          <p className="text-3xl font-bold mb-4">라운드 {currentRound}</p>
          <div className="flex gap-4">
            <button
              onClick={handleStartRound}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              라운드 시작
            </button>
            <button
              onClick={handleEndRound}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              라운드 종료
            </button>
          </div>
        </div>

        <div className="bg-primary/20 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">참가자 배정</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">남성 (10명)</h3>
              <div className="space-y-2">
                {profiles
                  .filter((p) => {
                    // 실제로는 user 데이터에서 gender를 확인해야 함
                    return true; // 임시
                  })
                  .slice(0, 10)
                  .map((profile) => (
                    <div key={profile.uid} className="bg-deep-green rounded p-2">
                      {profile.displayName}
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">여성 (10명)</h3>
              <div className="space-y-2">
                {profiles
                  .filter((p) => {
                    return true; // 임시
                  })
                  .slice(10, 20)
                  .map((profile) => (
                    <div key={profile.uid} className="bg-deep-green rounded p-2">
                      {profile.displayName}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary/20 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">라운드 히스토리</h2>
          <div className="space-y-2">
            {rounds.map((round) => (
              <div key={`${round.eventId}_${round.roundNumber}`} className="bg-deep-green rounded p-4">
                <p className="font-semibold">라운드 {round.roundNumber}</p>
                <p className="text-sm text-gray-300">
                  시작: {new Date(round.startTime).toLocaleString("ko-KR")}
                  {round.endTime && ` | 종료: ${new Date(round.endTime).toLocaleString("ko-KR")}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

