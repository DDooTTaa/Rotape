"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getUserApplications, getApplicationsByEventId } from "@/lib/firebase/applications";
import { getEvent } from "@/lib/firebase/events";
import { getUser } from "@/lib/firebase/users";
import { sendMessage, getSentMessageCountByEvent } from "@/lib/firebase/messages";
import { Event, Application, User as UserData } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface EventWithParticipants extends Event {
  application: Application;
  participants: Array<{
    user: UserData;
    application: Application & { docId: string };
  }>;
}

export default function MyEventsPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [events, setEvents] = useState<EventWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGender, setUserGender] = useState<"M" | "F" | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<{ user: UserData; eventId: string } | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sentMessageCounts, setSentMessageCounts] = useState<Record<string, number>>({});

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
      
      // 사용자 정보 가져오기 (성별 확인용)
      const currentUserData = await getUser(user.uid);
      setUserGender(currentUserData?.gender || null);
      
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
                // 행사 참가자 목록 가져오기 (승인된 사람만)
                const allApplications = await getApplicationsByEventId(app.eventId!);
                const approvedApplications = allApplications.filter(a => a.status === "approved");
                
                // 참가자 정보 가져오기
                const participants = await Promise.all(
                  approvedApplications
                    .filter(a => a.uid !== user.uid) // 본인 제외
                    .map(async (participantApp) => {
                      try {
                        const participantUser = await getUser(participantApp.uid);
                        return {
                          user: participantUser!,
                          application: participantApp,
                        };
                      } catch (error) {
                        console.error("참가자 정보 로드 실패:", error);
                        return null;
                      }
                    })
                );
                
                // 이성만 필터링
                const otherGenderParticipants = participants
                  .filter((p): p is { user: UserData; application: Application & { docId: string } } => 
                    p !== null && 
                    p.user?.gender && 
                    p.user.gender !== currentUserData?.gender
                  );
                
                return { 
                  ...event, 
                  application: app,
                  participants: otherGenderParticipants,
                };
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
        .filter((item): item is EventWithParticipants => 
          item !== null && isEventEnded(item)
        )
        .sort((a, b) => {
          // 최근 종료된 행사가 먼저 오도록 정렬
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
      
      setEvents(endedEvents);
      
      // 각 모임에서 보낸 쪽지 개수 조회
      const counts: Record<string, number> = {};
      await Promise.all(
        endedEvents.map(async (event) => {
          try {
            const count = await getSentMessageCountByEvent(event.eventId, user.uid);
            counts[event.eventId] = count;
          } catch (error) {
            console.error("쪽지 개수 조회 실패:", error);
            counts[event.eventId] = 0;
          }
        })
      );
      setSentMessageCounts(counts);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedParticipant || !messageContent.trim()) return;
    
    // 모임당 쪽지 3개 제한 확인
    const currentCount = sentMessageCounts[selectedParticipant.eventId] || 0;
    if (currentCount >= 3) {
      alert("이 모임에서는 쪽지를 3개까지만 보낼 수 있습니다.");
      return;
    }
    
    try {
      setSendingMessage(true);
      await sendMessage(
        selectedParticipant.eventId,
        user.uid,
        selectedParticipant.user.uid,
        messageContent.trim()
      );
      
      // 보낸 쪽지 개수 업데이트
      setSentMessageCounts(prev => ({
        ...prev,
        [selectedParticipant.eventId]: (prev[selectedParticipant.eventId] || 0) + 1,
      }));
      
      alert("쪽지가 전송되었습니다.");
      setMessageModalOpen(false);
      setMessageContent("");
      setSelectedParticipant(null);
    } catch (error) {
      console.error("쪽지 전송 실패:", error);
      alert("쪽지 전송에 실패했습니다.");
    } finally {
      setSendingMessage(false);
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

                  {/* 이성 참가자 목록 */}
                  {event.participants.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">참가자</p>
                        <span className="text-xs text-gray-500">
                          쪽지 {sentMessageCounts[event.eventId] || 0}/3
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.participants.map((participant) => (
                          <div
                            key={participant.user.uid}
                            className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                              {participant.user.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-800">
                              {participant.user.name}
                            </span>
                            <button
                              onClick={() => {
                                const currentCount = sentMessageCounts[event.eventId] || 0;
                                if (currentCount >= 3) {
                                  alert("이 모임에서는 쪽지를 3개까지만 보낼 수 있습니다.");
                                  return;
                                }
                                setSelectedParticipant({
                                  user: participant.user,
                                  eventId: event.eventId,
                                });
                                setMessageModalOpen(true);
                              }}
                              disabled={(sentMessageCounts[event.eventId] || 0) >= 3}
                              className={`ml-2 transition ${
                                (sentMessageCounts[event.eventId] || 0) >= 3
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-primary hover:text-primary/80"
                              }`}
                              title={
                                (sentMessageCounts[event.eventId] || 0) >= 3
                                  ? "이 모임에서는 쪽지를 3개까지만 보낼 수 있습니다."
                                  : "쪽지 보내기"
                              }
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

      {/* 쪽지 보내기 모달 */}
      {messageModalOpen && selectedParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedParticipant.user.name}에게 쪽지 보내기
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  남은 쪽지: {3 - (sentMessageCounts[selectedParticipant.eventId] || 0)}/3
                </p>
              </div>
              <button
                onClick={() => {
                  setMessageModalOpen(false);
                  setMessageContent("");
                  setSelectedParticipant(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="쪽지 내용을 입력하세요..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {messageContent.length}/500
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setMessageModalOpen(false);
                  setMessageContent("");
                  setSelectedParticipant(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                disabled={sendingMessage}
              >
                취소
              </button>
              <button
                onClick={handleSendMessage}
                disabled={
                  !messageContent.trim() || 
                  sendingMessage || 
                  (sentMessageCounts[selectedParticipant.eventId] || 0) >= 3
                }
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-[#0d4a1a] text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage 
                  ? "전송 중..." 
                  : (sentMessageCounts[selectedParticipant.eventId] || 0) >= 3
                  ? "3개 제한 도달"
                  : "보내기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

