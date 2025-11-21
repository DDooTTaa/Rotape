"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getAllApplications, updateApplicationStatus } from "@/lib/firebase/applications";
import { getUser } from "@/lib/firebase/users";
import { Application, User } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function ApplicationsPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [applications, setApplications] = useState<(Application & { user?: User })[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<(Application & { user?: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all" as "all" | "pending" | "approved" | "rejected",
    gender: "all" as "all" | "M" | "F",
  });
  const [selectedApp, setSelectedApp] = useState<(Application & { user?: User }) | null>(null);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const loadApplications = async () => {
    try {
      const apps = await getAllApplications();
      const appsWithUsers = await Promise.all(
        apps.map(async (app) => {
          const userData = await getUser(app.uid);
          return { ...app, user: userData || undefined };
        })
      );
      setApplications(appsWithUsers);
    } catch (error) {
      console.error("지원서 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (filters.status !== "all") {
      filtered = filtered.filter((app) => app.status === filters.status);
    }

    if (filters.gender !== "all") {
      filtered = filtered.filter((app) => app.user?.gender === filters.gender);
    }

    if (filters.search) {
      filtered = filtered.filter(
        (app) =>
          app.user?.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          app.job.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  };

  const handleApprove = async (uid: string) => {
    if (!confirm("이 지원자를 승인하시겠습니까?")) return;
    try {
      await updateApplicationStatus(uid, "approved");
      await loadApplications();
      alert("승인되었습니다.");
    } catch (error) {
      console.error("승인 실패:", error);
      alert("승인에 실패했습니다.");
    }
  };

  const handleReject = async (uid: string) => {
    if (!confirm("이 지원자를 거절하시겠습니까?")) return;
    try {
      await updateApplicationStatus(uid, "rejected");
      await loadApplications();
      alert("거절되었습니다.");
    } catch (error) {
      console.error("거절 실패:", error);
      alert("거절에 실패했습니다.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-foreground flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">지원자 리스트</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            로그아웃
          </button>
        </div>

        {/* 필터 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="이름/직업 검색"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 rounded-lg bg-white text-foreground border-2 border-primary/30 focus:border-primary"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="px-4 py-2 rounded-lg bg-white text-foreground border-2 border-primary/30 focus:border-primary"
            >
              <option value="all">전체 상태</option>
              <option value="pending">심사 중</option>
              <option value="approved">승인됨</option>
              <option value="rejected">거절됨</option>
            </select>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value as any })}
              className="px-4 py-2 rounded-lg bg-white text-foreground border-2 border-primary/30 focus:border-primary"
            >
              <option value="all">전체 성별</option>
              <option value="M">남성</option>
              <option value="F">여성</option>
            </select>
          </div>
        </div>

        {/* 지원자 목록 */}
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.uid}
              className="bg-gray-100 border-2 border-primary rounded-lg p-4 cursor-pointer hover:bg-primary group transition"
              onClick={() => setSelectedApp(app)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold group-hover:text-white transition">{app.user?.name || "이름 없음"}</p>
                  <p className="text-sm text-gray-700 group-hover:text-white transition">
                    {app.user?.gender === "M" ? "남성" : "여성"} | {app.user?.age}세 | {app.job}
                  </p>
                  <p className="text-sm text-gray-600 group-hover:text-white mt-1 transition">
                    상태: {app.status === "pending" ? "심사 중" : app.status === "approved" ? "승인됨" : "거절됨"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {app.status === "pending" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(app.uid);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                      >
                        승인
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(app.uid);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                      >
                        거절
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 상세 정보 모달 */}
        {selectedApp && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            onClick={() => setSelectedApp(null)}
          >
            <div
              className="bg-white border-2 border-primary rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">지원서 상세</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">이름</p>
                  <p>{selectedApp.user?.name}</p>
                </div>
                <div>
                  <p className="font-semibold">성별</p>
                  <p>{selectedApp.user?.gender === "M" ? "남성" : "여성"}</p>
                </div>
                <div>
                  <p className="font-semibold">나이</p>
                  <p>{selectedApp.user?.age}세</p>
                </div>
                <div>
                  <p className="font-semibold">키</p>
                  <p>{selectedApp.height}cm</p>
                </div>
                <div>
                  <p className="font-semibold">직업</p>
                  <p>{selectedApp.job}</p>
                </div>
                <div>
                  <p className="font-semibold">나를 한 줄로 소개</p>
                  <p>{selectedApp.intro}</p>
                </div>
                <div>
                  <p className="font-semibold">이상형 한 줄</p>
                  <p>{selectedApp.idealType}</p>
                </div>
                <div>
                  <p className="font-semibold">어떤 연애를 하고 싶은가요</p>
                  <p>{selectedApp.loveStyle}</p>
                </div>
                <div>
                  <p className="font-semibold">사랑의 언어</p>
                  <p>{selectedApp.loveLanguage.join(", ")}</p>
                </div>
                <div>
                  <p className="font-semibold">사진</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedApp.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                {selectedApp.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedApp.uid);
                        setSelectedApp(null);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedApp.uid);
                        setSelectedApp(null);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                    >
                      거절
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedApp(null)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

