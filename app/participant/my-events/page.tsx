"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getUserApplications } from "@/lib/firebase/applications";
import { getEvent } from "@/lib/firebase/events";
import { Event, Application } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function MyEventsPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [events, setEvents] = useState<Array<Event & { application: Application }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // 행사 종료 시간 계산 함수
  const calculateEventEndTime = (event: Event): Date | null => {
    // endTime 필드가 있으면 사용
    if (event.endTime) {
      return event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
    }
    
    // schedule.part2에서 종료 시간 추출 (예: "17:00")
    if (event.schedule?.part2) {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      const timeStr = event.schedule.part2.trim();
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      if (!isNaN(hours) && !isNaN(minutes)) {
        const endTime = new Date(eventDate);
        endTime.setHours(hours, minutes || 0, 0, 0);
        return endTime;
      }
    }
    
    return null;
  };

  // 행사가 종료되었는지 확인
  const isEventEnded = (event: Event): boolean => {
    const now = new Date();
    const endTime = calculateEventEndTime(event);
    
    if (endTime) {
      return now.getTime() >= endTime.getTime();
    }
    
    // 종료 시간이 없으면 날짜만 비교
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return eventDateOnly.getTime() < todayOnly.getTime();
  };

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 사용자의 모든 지원서 가져오기
      const applications = await getUserApplications(user.uid);
      
      // eventId가 있는 지원서만 필터링하고, 각 행사 정보 가져오기
      const eventsWithApplications = await Promise.all(
        applications
          .filter(app => app.eventId) // eventId가 있는 지원서만
          .map(async (app) => {
            try {
              const event = await getEvent(app.eventId!);
              if (event) {
                return { ...event, application: app };
              }
              return null;
            } catch (error) {
              console.error("행사 정보 로드 실패:", error);
              return null;
            }
          })
      );
      
      // null 제거 및 종료된 행사만 필터링
      const endedEvents = eventsWithApplications
        .filter((item): item is Event & { application: Application } => 
          item !== null && isEventEnded(item)
        )
        .sort((a, b) => {
          // 최근 종료된 행사가 먼저 오도록 정렬
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
      
      setEvents(endedEvents);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
            내 모임
          </h1>
          <p className="text-gray-600 mt-2">참여한 종료된 모임 목록입니다.</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">참여한 종료된 모임이 없습니다.</p>
            <Link
              href="/participant/events"
              className="inline-block mt-4 bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              행사 보기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const statusLabelMap: Record<Application["status"], string> = {
                approved: "승인됨",
                pending: "심사 중",
                rejected: "거절됨",
              };
              const statusClassMap: Record<Application["status"], string> = {
                approved: "bg-green-100 text-green-800",
                pending: "bg-yellow-100 text-yellow-800",
                rejected: "bg-gray-100 text-gray-600",
              };

              return (
                <div
                  key={event.eventId}
                  className="card-elegant card-hover p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="flex-1 min-w-0 pr-3 text-xl font-semibold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
                      {event.title}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusClassMap[event.application.status]}`}
                    >
                      {statusLabelMap[event.application.status]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>
                      <span className="font-semibold text-gray-800">일시:</span>{" "}
                      {event.date instanceof Date
                        ? event.date.toLocaleString("ko-KR")
                        : new Date(event.date).toLocaleString("ko-KR")}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-800">장소:</span> {event.location}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/participant/results?eventId=${event.eventId}`}
                      className="flex-1 bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-4 py-2 rounded-lg font-semibold text-center hover:opacity-90 transition"
                    >
                      결과 보기
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

