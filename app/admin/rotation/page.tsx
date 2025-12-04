"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getRoundsByEvent, createRound, endRound } from "@/lib/firebase/rounds";
import { getApplicationsByEventId } from "@/lib/firebase/applications";
import { getUser } from "@/lib/firebase/users";
import { Round, Application } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function RotationPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [applications, setApplications] = useState<(Application & { displayName?: string })[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [eventId, setEventId] = useState("current-event-id");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const roundsData = await getRoundsByEvent(eventId);
      setRounds(roundsData);

      const applicationsData = await getApplicationsByEventId(eventId);
      const paidApplications = applicationsData.filter(app => app.status === "paid");
      
      // 각 지원서에 displayName 추가
      const applicationsWithDisplayName = await Promise.all(
        paidApplications.map(async (app) => {
          try {
            const userData = await getUser(app.uid);
            return {
              ...app,
              displayName: app.nickname || userData?.name || "",
            };
          } catch {
            return {
              ...app,
              displayName: app.nickname || "",
            };
          }
        })
      );
      
      setApplications(applicationsWithDisplayName);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    }
  }, [eventId]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleStartRound = async () => {
    setLoading(true);
    try {
      await createRound({
        eventId,
        roundNumber: currentRound,
        participants: applications.map(app => app.uid),
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
    <div className="min-h-screen bg-white text-foreground pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">로테이션 진행</h1>
        </div>

        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">현재 라운드</h2>
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

        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">참가자 배정</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">남성</h3>
              <div className="space-y-2">
                {applications
                  .filter((app) => app.gender === "M")
                  .map((app) => (
                    <div key={app.uid} className="bg-white border border-primary/30 rounded p-2">
                      {app.displayName || app.nickname || "이름 없음"}
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">여성</h3>
              <div className="space-y-2">
                {applications
                  .filter((app) => app.gender === "F")
                  .map((app) => (
                    <div key={app.uid} className="bg-white border border-primary/30 rounded p-2">
                      {app.displayName || app.nickname || "이름 없음"}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">라운드 히스토리</h2>
          <div className="space-y-2">
            {rounds.map((round) => (
              <div key={`${round.eventId}_${round.roundNumber}`} className="bg-white border border-primary/30 rounded p-4">
                <p className="font-semibold">라운드 {round.roundNumber}</p>
                <p className="text-sm text-gray-700">
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

