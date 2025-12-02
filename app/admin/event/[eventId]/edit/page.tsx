"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getEvent, updateEvent } from "@/lib/firebase/events";
import { Event } from "@/lib/firebase/types";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import TimePickerPopup from "@/components/TimePickerPopup";
import CalendarPopup from "@/components/CalendarPopup";

export const dynamic = 'force-dynamic';

export default function EditEventPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    location: "",
    part2: "",
    break: "",
    maxParticipants: 20,
  });

  useEffect(() => {
    if (user && eventId) {
      loadEventData();
    }
  }, [user, eventId]);

  const loadEventData = async () => {
    if (!eventId) return;
    try {
      setIsLoadingData(true);
      const eventData = await getEvent(eventId);
      if (eventData) {
        setEvent(eventData);
        // Date를 datetime-local 형식으로 변환
        const dateValue = eventData.date instanceof Date 
          ? eventData.date 
          : new Date(eventData.date);
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        const hours = String(dateValue.getHours()).padStart(2, '0');
        const minutes = String(dateValue.getMinutes()).padStart(2, '0');
        const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

        setFormData({
          title: eventData.title || "",
          date: dateTimeLocal,
          location: eventData.location || "",
          part2: eventData.schedule?.part2 || "",
          break: eventData.schedule?.break || "",
          maxParticipants: eventData.maxParticipants || 20,
        });
      }
    } catch (error) {
      console.error("행사 정보 로드 실패:", error);
      alert("행사 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventId) return;

    // submit 버튼이 아닌 경우 실행 방지
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    if (submitter && (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement)) {
      if (submitter.type !== 'submit') {
        return;
      }
    }

    // 필수 입력 검증
    if (!formData.title.trim()) {
      alert("행사 제목을 입력해주세요.");
      return;
    }
    
    if (!formData.date) {
      alert("행사 일시를 선택해주세요.");
      return;
    }
    
    if (!formData.location.trim()) {
      alert("행사 장소를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await updateEvent(eventId, {
        title: formData.title.trim(),
        date: new Date(formData.date),
        location: formData.location.trim(),
        schedule: {
          part2: formData.part2,
          break: formData.break,
        },
        maxParticipants: formData.maxParticipants,
      });

      alert("행사 정보가 수정되었습니다.");
      router.push(`/admin/event/${eventId}`);
    } catch (error) {
      console.error("행사 수정 실패:", error);
      alert("행사 수정에 실패했습니다.");
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

  if (isLoadingData) {
    return (
      <div className="min-h-screen text-gray-800 pt-4 pb-24 md:py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-primary">행사 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link
            href={`/admin/event/${eventId}`}
            className="text-primary hover:underline mb-2 inline-block"
          >
            ← 행사 상세로 돌아가기
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
            행사 수정
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 행사 제목 */}
          <div>
            <label className="block mb-2 font-semibold">행사 제목</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 2024년 봄 로테이션 소개팅"
              className="input-elegant"
            />
          </div>

          {/* 행사 장소 */}
          <div>
            <label className="block mb-2 font-semibold">행사 장소</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="예: 서울시 강남구 테헤란로 123"
              className="input-elegant"
            />
          </div>

          {/* 행사 일시 */}
          <div>
            <label className="block mb-2 font-semibold">행사 일시</label>
            <CalendarPopup
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              placeholder="날짜를 선택해주세요"
              className="input-elegant"
            />
          </div>

          {/* 시작 시간 */}
          <div>
            <label className="block mb-2 font-semibold">시작 시간</label>
            <TimePickerPopup
              value={formData.break}
              onChange={(value) => setFormData({ ...formData, break: value })}
              placeholder="예: 16:00"
              className="input-elegant"
            />
          </div>

          {/* 종료 시간 */}
          <div>
            <label className="block mb-2 font-semibold">종료 시간</label>
            <TimePickerPopup
              value={formData.part2}
              onChange={(value) => setFormData({ ...formData, part2: value })}
              placeholder="예: 17:00"
              className="input-elegant"
            />
          </div>

          {/* 최대 참가자 수 */}
          <div>
            <label className="block mb-2 font-semibold">최대 참가자 수</label>
            <input
              type="number"
              required
              min="10"
              max="30"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
              className="input-elegant"
            />
            <p className="text-sm mt-1 text-gray-600">10명 이상 30명 이하로 설정해주세요</p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/event/${eventId}`)}
              className="flex-1 px-6 py-4 rounded-lg font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "수정 중..." : "수정 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
