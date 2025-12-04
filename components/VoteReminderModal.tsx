"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getUserApplications } from "@/lib/firebase/applications";
import { getEvent } from "@/lib/firebase/events";
import { getLike } from "@/lib/firebase/matching";
import { Event, Application } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VoteReminderModal() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [eventWithoutVote, setEventWithoutVote] = useState<Event | null>(null);
  const [checked, setChecked] = useState(false);

  // 행사 종료 시간 계산 함수
  const calculateEventEndTime = (event: Event): Date | null => {
    if (event.endTime) {
      return event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
    }
    
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
    
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return eventDateOnly.getTime() < todayOnly.getTime();
  };

  useEffect(() => {
    if (!user || checked) return;

    const checkUnvotedEvents = async () => {
      try {
        // 사용자의 모든 지원서 가져오기
        const applications = await getUserApplications(user.uid);
        
        // eventId가 있고 입금 완료된 지원서만 필터링
        const approvedApplications = applications.filter(
          app => app.eventId && app.status === "paid"
        );

        // 각 행사에 대해 종료 여부와 투표 여부 확인
        for (const app of approvedApplications) {
          if (!app.eventId) continue;
          
          try {
            const event = await getEvent(app.eventId);
            if (!event) continue;

            // 종료된 행사인지 확인
            if (isEventEnded(event)) {
              // 투표 여부 확인
              const like = await getLike(user.uid, app.eventId);
              
              // 투표하지 않은 경우 모달 표시
              if (!like) {
                setEventWithoutVote(event);
                setShowModal(true);
                setChecked(true);
                return; // 첫 번째 미투표 행사만 표시
              }
            }
          } catch (error) {
            console.error(`행사 ${app.eventId} 확인 실패:`, error);
          }
        }
        
        setChecked(true);
      } catch (error) {
        console.error("미투표 행사 확인 실패:", error);
        setChecked(true);
      }
    };

    checkUnvotedEvents();
  }, [user, checked]);

  const handleGoToVote = () => {
    if (eventWithoutVote) {
      router.push(`/participant/rotation?eventId=${eventWithoutVote.eventId}`);
      setShowModal(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  if (!showModal || !eventWithoutVote) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            투표가 필요합니다
          </h2>
          <p className="text-gray-600 mb-4">
            종료된 모임에서 아직 투표를 하지 않으셨습니다.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="font-semibold text-gray-800">{eventWithoutVote.title}</p>
            <p className="text-sm text-gray-600 mt-1">
              {eventWithoutVote.date instanceof Date
                ? eventWithoutVote.date.toLocaleString("ko-KR")
                : new Date(eventWithoutVote.date).toLocaleString("ko-KR")}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            나중에
          </button>
          <button
            onClick={handleGoToVote}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-[#0d4a1a] text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
          >
            투표하러 가기
          </button>
        </div>
      </div>
    </div>
  );
}

