"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getUser } from "@/lib/firebase/users";
import { getUserApplications } from "@/lib/firebase/applications";
import { getEvent } from "@/lib/firebase/events";
import { User, Application, Event } from "@/lib/firebase/types";
import Image from "next/image";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function MyProfilePage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);
  const [applications, setApplications] = useState<(Application & { event?: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<(Application & { event?: Event }) | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      // 사용자 정보 로드
      const userInfo = await getUser(user.uid);
      setUserData(userInfo);

      // 지원서 목록 로드
      console.log("지원서 조회 시작, uid:", user.uid);
      const apps = await getUserApplications(user.uid);
      console.log("조회된 지원서 개수:", apps.length);
      console.log("지원서 데이터:", apps);
      
      // 각 지원서에 대한 행사 정보 로드
      const appsWithEvents = await Promise.all(
        apps.map(async (app) => {
          if (app.eventId) {
            try {
              const event = await getEvent(app.eventId);
              return { ...app, event: event || undefined };
            } catch (error) {
              console.error("행사 정보 로드 실패:", error);
              return { ...app, event: undefined };
            }
          }
          return { ...app, event: undefined };
        })
      );
      
      setApplications(appsWithEvents);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      alert("지원서를 불러오는 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <p>사용자 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "심사 중";
      case "approved":
        return "승인됨";
      case "rejected":
        return "거절됨";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen text-gray-800 pt-4 pb-32 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">마이페이지</h1>
        </div>

        {/* 사용자 정보 */}
        <div className="card-elegant p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">내 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-1 text-gray-800">이름</p>
              <p className="text-gray-700">{userData.name || "미입력"}</p>
            </div>
            <div>
              <p className="font-semibold mb-1 text-gray-800">성별</p>
              <p className="text-gray-700">{userData.gender === "M" ? "남성" : "여성"}</p>
            </div>
            <div>
              <p className="font-semibold mb-1 text-gray-800">나이</p>
              <p className="text-gray-700">{userData.age > 0 ? `${userData.age + 1}세` : "미입력"}</p>
            </div>
          </div>
        </div>

        {/* 지원서 목록 */}
        <div className="card-elegant p-6">
          <h2 className="text-2xl font-bold mb-4">내 지원서</h2>
          {applications.length === 0 ? (
            <p className="text-gray-600">작성한 지원서가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedApp(app)}
                  className="bg-white border-2 border-primary/30 rounded-xl p-4 cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300 group card-hover"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 
                          className="font-bold text-lg group-hover:text-primary transition flex-1 min-w-0"
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {app.event ? app.event.title : "일반 지원서"}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 whitespace-nowrap ${getStatusColor(app.status)}`}>
                          {getStatusText(app.status)}
                        </span>
                      </div>
                      {app.event && (
                        <p className="text-sm text-gray-600 mb-2">
                          행사 일시: {app.event.date instanceof Date 
                            ? app.event.date.toLocaleDateString("ko-KR")
                            : new Date(app.event.date).toLocaleDateString("ko-KR")} | 
                          장소: {app.event.location}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-2">
                        직업: {app.job} | 키: {app.height}cm
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">{app.intro}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        작성일: {app.createdAt ? (
                          app.createdAt instanceof Date 
                            ? app.createdAt.toLocaleDateString("ko-KR")
                            : new Date(app.createdAt).toLocaleDateString("ko-KR")
                        ) : "날짜 정보 없음"}
                      </p>
                    </div>
                    {app.photos && app.photos.length > 0 && (
                      <div className="ml-4 relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={app.photos[0]}
                          alt="프로필 사진"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 지원서 상세 모달 */}
        {selectedApp && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            onClick={() => setSelectedApp(null)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedApp.event ? selectedApp.event.title : "일반 지원서"}
                </h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-1">상태</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${getStatusColor(selectedApp.status)}`}>
                    {getStatusText(selectedApp.status)}
                  </span>
                </div>

                {selectedApp.event && (
                  <div>
                    <p className="font-semibold mb-1">행사 정보</p>
                    <p className="text-gray-700">
                      일시: {selectedApp.event.date instanceof Date 
                        ? selectedApp.event.date.toLocaleDateString("ko-KR")
                        : new Date(selectedApp.event.date).toLocaleDateString("ko-KR")}
                    </p>
                    <p className="text-gray-700">장소: {selectedApp.event.location}</p>
                  </div>
                )}

                <div>
                  <p className="font-semibold mb-1">직업</p>
                  <p className="text-gray-700">{selectedApp.job}</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">키</p>
                  <p className="text-gray-700">{selectedApp.height}cm</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">나를 한 줄로 소개</p>
                  <p className="text-gray-700">{selectedApp.intro}</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">이상형 한 줄</p>
                  <p className="text-gray-700">{selectedApp.idealType}</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">어떤 연애를 하고 싶은가요?</p>
                  <p className="text-gray-700">{selectedApp.loveStyle}</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">사랑의 언어 순위</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.loveLanguage.map((lang, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                        {idx + 1}순위: {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedApp.photos && selectedApp.photos.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">사진</p>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedApp.photos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square">
                          <Image
                            src={photo}
                            alt={`사진 ${idx + 1}`}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="font-semibold mb-1">작성일</p>
                  <p className="text-gray-700">
                    {selectedApp.createdAt ? (
                      selectedApp.createdAt instanceof Date 
                        ? selectedApp.createdAt.toLocaleString("ko-KR")
                        : new Date(selectedApp.createdAt).toLocaleString("ko-KR")
                    ) : "날짜 정보 없음"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

