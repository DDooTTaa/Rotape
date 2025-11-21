"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getAllEvents } from "@/lib/firebase/events";
import { getApplicationByEvent } from "@/lib/firebase/applications";
import { Event, Application } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function EventsPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Record<string, Application | null>>({});
  const [loading, setLoading] = useState(true);
  const [applyingEventId, setApplyingEventId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const eventsData = await getAllEvents();
      setEvents(eventsData);

      // 각 행사에 대한 지원서 상태 확인
      const apps: Record<string, Application | null> = {};
      for (const event of eventsData) {
        try {
          const app = await getApplicationByEvent(user.uid, event.eventId);
          apps[event.eventId] = app;
        } catch (error) {
          apps[event.eventId] = null;
        }
      }
      setApplications(apps);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleApply = async (eventId: string) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 무조건 지원서 작성 페이지로 이동
    router.push(`/participant/application?eventId=${eventId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 pt-4 pb-8 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">행사 리스트</h1>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">현재 진행 중인 행사가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const application = applications[event.eventId];
              const status = application?.status;

              return (
                <div
                  key={event.eventId}
                  className="card-elegant card-hover p-6"
                >
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">{event.title}</h2>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-700">
                      <span className="font-semibold">일시:</span>{" "}
                      {new Date(event.date).toLocaleString("ko-KR")}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">장소:</span> {event.location}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">최대 인원:</span> {event.maxParticipants}명
                    </p>
                  </div>

                  {status === "pending" && (
                    <div className="mb-4">
                      <span className="bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                        심사 중
                      </span>
                    </div>
                  )}

                  {status === "approved" && (
                    <div className="mb-4">
                      <span className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                        승인됨
                      </span>
                    </div>
                  )}

                  {status === "rejected" && (
                    <div className="mb-4">
                      <span className="bg-gradient-to-r from-red-100 to-red-50 text-red-800 px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                        거절됨
                      </span>
                    </div>
                  )}

                  {!status && (
                    <button
                      onClick={() => handleApply(event.eventId)}
                      disabled={applyingEventId === event.eventId}
                      className="w-full bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                    >
                      {applyingEventId === event.eventId ? "신청 중..." : "행사 신청하기"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

