"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { createEvent, getAllEvents } from "@/lib/firebase/events";
import { getApplicationsByStatus } from "@/lib/firebase/applications";
import { createProfile } from "@/lib/firebase/profiles";
import { generateQRCode, dataURLtoBlob } from "@/lib/utils/qrcode";
import { uploadQRCode } from "@/lib/firebase/storage";
import { Event, Application } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function EventPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    location: "",
    intro: "",
    part1: "",
    part2: "",
    break: "",
    maxParticipants: 20,
  });

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
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventId = await createEvent({
        title: formData.title,
        date: new Date(formData.date),
        location: formData.location,
        schedule: {
          intro: formData.intro,
          part1: formData.part1,
          part2: formData.part2,
          break: formData.break,
        },
        maxParticipants: formData.maxParticipants,
        createdAt: new Date(),
      });

      // 승인된 지원자들을 프로필로 변환
      const approvedApps = await getApplicationsByStatus("approved");
      const maleApps = approvedApps.filter((app) => {
        // 실제로는 user 데이터에서 gender를 가져와야 함
        return true; // 임시
      }).slice(0, 10);
      const femaleApps = approvedApps.filter((app) => {
        return true; // 임시
      }).slice(0, 10);

      const selectedApps = [...maleApps, ...femaleApps];

      // 각 승인된 지원자에 대해 프로필 생성 및 QR 코드 생성
      for (const app of selectedApps) {
        const qrData = `${eventId}_${app.uid}`;
        const qrCodeDataURL = await generateQRCode(qrData);
        const qrCodeBlob = dataURLtoBlob(qrCodeDataURL);
        const qrCodeUrl = await uploadQRCode(eventId, app.uid, qrCodeBlob);

        await createProfile(app.uid, {
          eventId,
          displayName: "", // user 데이터에서 가져와야 함
          intro: app.intro,
          job: app.job,
          loveLanguage: app.loveLanguage,
          photos: app.photos,
          qrCode: qrCodeUrl,
        });
      }

      alert("행사가 생성되었습니다.");
      await loadEvents();
      setFormData({
        title: "",
        date: "",
        location: "",
        intro: "",
        part1: "",
        part2: "",
        break: "",
        maxParticipants: 20,
      });
    } catch (error) {
      console.error("행사 생성 실패:", error);
      alert("행사 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth!);
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-foreground py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">행사 설정</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            로그아웃
          </button>
        </div>

        <form onSubmit={handleCreateEvent} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold">행사 제목</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border-2 border-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">행사 일시</label>
            <input
              type="datetime-local"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border-2 border-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">행사 장소</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border-2 border-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">인트로 시간</label>
            <input
              type="text"
              value={formData.intro}
              onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border-2 border-primary/30 focus:border-primary"
              placeholder="예: 14:00"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">1부 시간</label>
            <input
              type="text"
              value={formData.part1}
              onChange={(e) => setFormData({ ...formData, part1: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border-2 border-primary/30 focus:border-primary"
              placeholder="예: 14:30"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">쉬는 시간</label>
            <input
              type="text"
              value={formData.break}
              onChange={(e) => setFormData({ ...formData, break: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border-2 border-primary/30 focus:border-primary"
              placeholder="예: 16:00"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">2부 시간</label>
            <input
              type="text"
              value={formData.part2}
              onChange={(e) => setFormData({ ...formData, part2: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border-2 border-primary/30 focus:border-primary"
              placeholder="예: 16:15"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">최대 참가자 수</label>
            <input
              type="number"
              required
              min="10"
              max="30"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-foreground border-2 border-primary/30 focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-6 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "생성 중..." : "행사 생성"}
          </button>
        </form>

        {/* 기존 행사 목록 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">기존 행사</h2>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.eventId} className="bg-gray-100 border-2 border-primary rounded-lg p-4">
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <p className="text-sm text-gray-300">
                  {new Date(event.date).toLocaleString("ko-KR")} | {event.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

