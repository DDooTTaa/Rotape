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
        paidApplicants: number;
        paidMale: number;
        paidFemale: number;
      }
    >
  >({});

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

  // 행사 상태 판단 함수
  const getEventStatus = (event: Event): 'past' | 'active' | 'upcoming' | 'ended' => {
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    const now = new Date();
    // 날짜만 비교
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 종료 시간 확인
    const endTime = calculateEventEndTime(event);
    if (endTime && now.getTime() >= endTime.getTime()) {
      return 'ended'; // 종료 시간이 지났으면 'ended'
    }
    
    if (eventDateOnly.getTime() < todayOnly.getTime()) {
      return 'past'; // 지난 행사
    } else if (eventDateOnly.getTime() === todayOnly.getTime()) {
      return 'active'; // 진행중인 행사
    } else {
      return 'upcoming'; // 진행할 행사
    }
  };

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      const data = await getAllEvents();
      // 예정 행사를 위로 오름차순 정렬
      const sortedEvents = data.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        const statusA = getEventStatus(a);
        const statusB = getEventStatus(b);
        
        // 상태별 우선순위: active > upcoming > ended > past
        const statusOrder: Record<'active' | 'upcoming' | 'ended' | 'past', number> = { 
          'active': 0, 
          'upcoming': 1, 
          'ended': 2, 
          'past': 3 
        };
        const statusDiff = statusOrder[statusA] - statusOrder[statusB];
        
        if (statusDiff !== 0) return statusDiff;
        
        // 같은 상태 내에서는 날짜 오름차순 (예정 행사는 가까운 날짜가 위로)
        if (statusA === 'upcoming') {
          return dateA.getTime() - dateB.getTime();
        }
        // 지난 행사와 종료된 행사는 최근 날짜가 위로
        if (statusA === 'past' || statusA === 'ended') {
          return dateB.getTime() - dateA.getTime();
        }
        // 진행중인 행사는 날짜 오름차순
        return dateA.getTime() - dateB.getTime();
      });
      
      setEvents(sortedEvents);
      await loadEventStats(sortedEvents);
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
          const paidApps = apps.filter((app) => app.status === "paid");

          let paidMale = 0;
          let paidFemale = 0;

          if (paidApps.length > 0) {
            const genders = await Promise.all(
              paidApps.map(async (app) => {
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
                paidMale += 1;
              } else if (gender === "F") {
                paidFemale += 1;
              }
            });
          }

          return [
            event.eventId,
            {
              totalApplicants,
              paidApplicants: paidApps.length,
              paidMale,
              paidFemale,
            },
          ] as const;
        } catch (error) {
          console.error(`행사 통계 로드 실패 (${event.eventId}):`, error);
          return [
            event.eventId,
            {
              totalApplicants: 0,
              paidApplicants: 0,
              paidMale: 0,
              paidFemale: 0,
            },
          ] as const;
        }
      })
    );

    setEventStats(Object.fromEntries(statsEntries));
  };

  // 진행중인 행사 판단 함수 (기존 호환성 유지)
  const isEventActive = (event: Event): boolean => {
    return getEventStatus(event) === 'active';
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
          <h2 className="text-2xl font-bold mb-6">로테이션 소개팅 리스트</h2>
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

                const eventStatus = getEventStatus(event);
                const isActive = eventStatus === 'active';

                return (
                  <Link
                    key={event.eventId}
                    href={`/admin/event/${event.eventId}`}
                    className={`block card-elegant card-hover p-4 hover:bg-primary/5 transition-colors ${isActive ? 'event-active' : ''} relative ${eventStatus === 'past' || eventStatus === 'ended' ? 'opacity-60' : ''}`}
                  >
                    {eventStatus === 'active' && (
                      <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        진행중
                      </div>
                    )}
                    {eventStatus === 'upcoming' && (
                      <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        예정
                      </div>
                    )}
                    {eventStatus === 'past' && (
                      <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        지난 행사
                      </div>
                    )}
                    {eventStatus === 'ended' && (
                      <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        종료
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
                            {(() => {
                              const startDate = event.date instanceof Date 
                                ? event.date 
                                : new Date(event.date);
                              const endTime = calculateEventEndTime(event);
                              const startStr = startDate.toLocaleString("ko-KR");
                              if (endTime) {
                                const endStr = endTime.toLocaleString("ko-KR", { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                                return `${startStr} ~ ${endStr}`;
                              }
                              return startStr;
                            })()}
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
                                    {stats.paidMale}/{maleQuota}
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
                                    {stats.paidFemale}/{femaleQuota}
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
                                  입금완료 {stats.paidApplicants}명
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

