"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getAllEvents } from "@/lib/firebase/events";
import { getApplicationsByEventId } from "@/lib/firebase/applications";
import { getUser } from "@/lib/firebase/users";
import { Event } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventStats, setEventStats] = useState<
    Record<
      string,
      {
        totalApplicants: number;
        approvedApplicants: number;
        approvedMale: number;
        approvedFemale: number;
      }
    >
  >({});

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
      await loadEventStats(data);
    } catch (error) {
      console.error("행사 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventStats = async (eventList: Event[]) => {
    const statsEntries = await Promise.all(
      eventList.map(async (event) => {
        try {
          const apps = await getApplicationsByEventId(event.eventId);
          const totalApplicants = apps.length;
          const approvedApps = apps.filter((app) => app.status === "approved");

          let approvedMale = 0;
          let approvedFemale = 0;

          if (approvedApps.length > 0) {
            const genders = await Promise.all(
              approvedApps.map(async (app) => {
                try {
                  const userData = await getUser(app.uid);
                  return userData?.gender || null;
                } catch (userError) {
                  console.error(`사용자 정보 로드 실패 (${app.uid}):`, userError);
                  return null;
                }
              })
            );

            genders.forEach((gender) => {
              if (gender === "M") {
                approvedMale += 1;
              } else if (gender === "F") {
                approvedFemale += 1;
              }
            });
          }

          return [
            event.eventId,
            {
              totalApplicants,
              approvedApplicants: approvedApps.length,
              approvedMale,
              approvedFemale,
            },
          ] as const;
        } catch (error) {
          console.error(`행사 통계 로드 실패 (${event.eventId}):`, error);
          return [
            event.eventId,
            {
              totalApplicants: 0,
              approvedApplicants: 0,
              approvedMale: 0,
              approvedFemale: 0,
            },
          ] as const;
        }
      })
    );

    setEventStats(Object.fromEntries(statsEntries));
  };

  // 진행중인 행사 판단 함수
  const isEventActive = (event: Event): boolean => {
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    const now = new Date();
    // 행사 날짜가 오늘인지 확인 (날짜만 비교)
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return eventDateOnly.getTime() === todayOnly.getTime();
  };

  if (loading) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">행사 관리</h1>
          <Link
            href="/admin/event"
            className="bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            + 행사 생성
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">행사 리스트</h2>
          {events.length === 0 ? (
            <div className="text-center py-12 card-elegant">
              <p className="text-gray-600 text-lg">생성된 행사가 없습니다.</p>
              <Link
                href="/admin/event"
                className="inline-block mt-4 bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                첫 행사 만들기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const stats = eventStats[event.eventId];
                const maleQuota = Math.floor(event.maxParticipants / 2);
                const femaleQuota = event.maxParticipants - maleQuota;

                const isActive = isEventActive(event);

                return (
                  <Link
                    key={event.eventId}
                    href={`/admin/event/${event.eventId}`}
                    className={`block card-elegant card-hover p-4 hover:bg-primary/5 transition-colors ${isActive ? 'event-active' : ''} relative`}
                  >
                    {isActive && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        진행중
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1">
                        <h3
                          className="text-base font-semibold mb-1 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent"
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                          <span>
                            <span className="font-semibold">일시:</span>{" "}
                            {event.date instanceof Date 
                              ? event.date.toLocaleString("ko-KR")
                              : new Date(event.date).toLocaleString("ko-KR")}
                          </span>
                          <span>
                            <span className="font-semibold">장소:</span> {event.location}
                          </span>
                          <span>
                            <span className="font-semibold">최대 인원:</span> {event.maxParticipants}명 (남 {maleQuota} / 여 {femaleQuota})
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                          {stats ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center justify-between bg-white/70 border border-blue-100 rounded-xl px-3 py-2">
                                  <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                                    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-6 2.69-6 6h2a4 4 0 018 0h2c0-3.31-2.69-6-6-6z" />
                                    </svg>
                                    남자
                                  </span>
                                  <span className="text-blue-700 font-semibold text-base">
                                    {stats.approvedMale}/{maleQuota}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between bg-white/70 border border-pink-100 rounded-xl px-3 py-2">
                                  <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                                    <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                    여자
                                  </span>
                                  <span className="text-pink-600 font-semibold text-base">
                                    {stats.approvedFemale}/{femaleQuota}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 10a5 5 0 0110 0v2a5 5 0 01-10 0v-2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 21h14" />
                                  </svg>
                                  전체 {stats.totalApplicants}명
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 12l2 2 4-4" />
                                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  승인 {stats.approvedApplicants}명
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">통계를 불러오는 중...</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="text-primary font-semibold text-sm">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

