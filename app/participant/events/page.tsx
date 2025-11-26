"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getAllEvents } from "@/lib/firebase/events";
import { getApplicationByEvent, getApplicationsByEventId } from "@/lib/firebase/applications";
import { getUser } from "@/lib/firebase/users";
import { Event, Application, User as UserData } from "@/lib/firebase/types";
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
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventParticipants, setEventParticipants] = useState<
    Array<{
      application: Application;
      user: UserData | null;
    }>
  >([]);

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

  const handleViewParticipants = async (eventData: Event) => {
    setSelectedEvent(eventData);
    setParticipantsModalOpen(true);
    setParticipantsLoading(true);
    try {
      const apps = await getApplicationsByEventId(eventData.eventId);
      const applicantsWithUser = await Promise.all(
        apps.map(async (app) => {
          try {
            const userData = await getUser(app.uid);
            return { application: app, user: userData };
          } catch (error) {
            console.error("지원자 사용자 정보 로드 실패:", error);
            return { application: app, user: null };
          }
        })
      );

      const statusOrder: Record<Application["status"], number> = {
        approved: 0,
        pending: 1,
        rejected: 2,
      };

      applicantsWithUser.sort(
        (a, b) =>
          statusOrder[a.application.status] - statusOrder[b.application.status]
      );

      setEventParticipants(applicantsWithUser);
    } catch (error) {
      console.error("지원자 목록 로드 실패:", error);
      alert("지원자 정보를 불러오는 중 문제가 발생했습니다.");
      setEventParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const closeParticipantsModal = () => {
    setParticipantsModalOpen(false);
    setEventParticipants([]);
    setSelectedEvent(null);
    setParticipantsLoading(false);
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
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">진행중인 모임</h1>
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
                    <span className="text-sm font-semibold text-gray-500">
                      다음 기회에
                    </span>
                  );
                }
                return null;
              };

              const isActive = isEventActive(event) && status === "approved";

              return (
                <div
                  key={event.eventId}
                  className={`card-elegant card-hover p-6 ${isActive ? 'event-active cursor-pointer' : ''}`}
                  onClick={() => {
                    if (isActive) {
                      handleViewParticipants(event);
                    }
                  }}
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isActive ? (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          오늘 진행 예정
                        </div>
                      ) : (
                        <>
                          {renderStatusBadge()}
                          {!status && (
                            <button
                              onClick={() => handleApply(event.eventId)}
                              disabled={applyingEventId === event.eventId}
                              className="bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none whitespace-nowrap"
                            >
                              {applyingEventId === event.eventId ? "신청 중..." : "신청하기"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {participantsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-4">
          <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-primary tracking-widest uppercase">
                  오늘 진행 예정
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                  {selectedEvent?.title}
                </h2>
                {selectedEvent && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedEvent.date instanceof Date
                      ? selectedEvent.date.toLocaleString("ko-KR")
                      : new Date(selectedEvent.date).toLocaleString("ko-KR")}{" "}
                    · {selectedEvent.location}
                  </p>
                )}
              </div>
              <button
                onClick={closeParticipantsModal}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {participantsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">지원자 정보를 불러오는 중...</p>
              </div>
            ) : eventParticipants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                아직 지원자가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {eventParticipants.map(({ application, user }, index) => {
                  const statusLabelMap: Record<Application["status"], string> = {
                    approved: "승인됨",
                    pending: "심사 중",
                    rejected: "다음 기회에",
                  };
                  const statusClassMap: Record<Application["status"], string> = {
                    approved: "bg-green-100 text-green-800",
                    pending: "bg-yellow-100 text-yellow-800",
                    rejected: "bg-gray-100 text-gray-600",
                  };

                  return (
                    <div
                      key={`${application.uid}-${index}`}
                      className="border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {user?.name || "이름 미등록"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user?.gender === "M" ? "남성" : user?.gender === "F" ? "여성" : "성별 미등록"}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClassMap[application.status]}`}
                        >
                          {statusLabelMap[application.status]}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <p>
                          <span className="font-semibold text-gray-800">직업:</span>{" "}
                          {application.job || "미입력"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-800">한 줄 소개:</span>{" "}
                          {application.intro || "미입력"}
                        </p>
                        <p className="md:col-span-2">
                          <span className="font-semibold text-gray-800">이상형:</span>{" "}
                          {application.idealType || "미입력"}
                        </p>
                        <div className="md:col-span-2">
                          <span className="font-semibold text-gray-800">사랑의 언어:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {application.loveLanguage?.length > 0 ? (
                              application.loveLanguage.map((lang) => (
                                <span
                                  key={lang}
                                  className="px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-semibold border border-primary/20"
                                >
                                  {lang}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400">미입력</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={closeParticipantsModal}
                className="w-full bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

