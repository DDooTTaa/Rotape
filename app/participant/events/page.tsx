"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getAllEvents } from "@/lib/firebase/events";
import { getApplicationByEvent, getApplicationsByEventId } from "@/lib/firebase/applications";
import { getUser } from "@/lib/firebase/users";
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
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const eventsData = await getAllEvents();
      setEvents(eventsData);
      loadEventStats(eventsData);

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
              const stats = eventStats[event.eventId];
              const maleQuota = Math.floor(event.maxParticipants / 2);
              const femaleQuota = event.maxParticipants - maleQuota;

              const renderStatusBadge = () => {
                if (status === "pending") {
                  return (
                    <span className="bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-xs font-semibold shadow-md">
                      심사 중
                    </span>
                  );
                }
                if (status === "approved") {
                  return (
                    <span className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 px-4 py-2 rounded-full text-xs font-semibold shadow-md">
                      승인됨
                    </span>
                  );
                }
                if (status === "rejected") {
                  return (
                    <span className="bg-gradient-to-r from-red-100 to-red-50 text-red-800 px-4 py-2 rounded-full text-xs font-semibold shadow-md">
                      거절됨
                    </span>
                  );
                }
                return null;
              };

              return (
                <div
                  key={event.eventId}
                  className="card-elegant card-hover p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2
                      className="flex-1 min-w-0 pr-3 text-xl font-semibold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {event.title}
                    </h2>
                    {renderStatusBadge()}
                  </div>
                  <div className="space-y-2 mb-3 text-sm">
                    <p className="text-gray-700">
                      <span className="font-semibold">일시:</span>{" "}
                      {event.date instanceof Date 
                        ? event.date.toLocaleString("ko-KR")
                        : new Date(event.date).toLocaleString("ko-KR")}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">장소:</span> {event.location}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">최대 인원:</span> {event.maxParticipants}명 (남 {maleQuota} / 여 {femaleQuota})
                    </p>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
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
                            <span className="text-blue-700 font-semibold">
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
                            <span className="text-pink-600 font-semibold">
                              {stats.approvedFemale}/{femaleQuota}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">통계를 불러오는 중...</span>
                    )}
                  </div>

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

