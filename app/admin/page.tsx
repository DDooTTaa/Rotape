"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getAllEvents } from "@/lib/firebase/events";
import { Event } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error("행사 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground pt-4 pb-8 md:py-8 px-4">
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
              {events.map((event) => (
                <Link
                  key={event.eventId}
                  href={`/admin/event/${event.eventId}`}
                  className="block card-elegant card-hover p-4 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
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
                          <span className="font-semibold">최대 인원:</span> {event.maxParticipants}명
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="text-primary font-semibold text-sm">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

