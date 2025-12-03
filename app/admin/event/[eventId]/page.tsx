"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getEvent } from "@/lib/firebase/events";
import { getApplicationsByEventId, updateApplicationStatus } from "@/lib/firebase/applications";
import { getUser } from "@/lib/firebase/users";
import { getAllLikesForEvent } from "@/lib/firebase/matching";
import { Event, Application, User, Like } from "@/lib/firebase/types";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function EventDetailPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [applications, setApplications] = useState<(Application & { user?: User; docId?: string })[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<(Application & { user?: User; docId?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all" as "all" | "pending" | "approved" | "rejected" | "paid",
    gender: "all" as "all" | "M" | "F",
  });
  const [selectedApp, setSelectedApp] = useState<(Application & { user?: User }) | null>(null);
  const [votes, setVotes] = useState<(Like & { voter?: User; firstTarget?: User; secondTarget?: User; thirdTarget?: User })[]>([]);
  const [votesLoading, setVotesLoading] = useState(false);

  useEffect(() => {
    if (user && eventId) {
      loadData();
    }
  }, [user, eventId]);

  useEffect(() => {
    if (event && eventId) {
      checkAndLoadVotes();
    }
  }, [event, eventId]);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const loadData = async () => {
    if (!eventId) return;
    try {
      // 행사 정보 로드
      const eventData = await getEvent(eventId);
      setEvent(eventData);

      // 행사별 지원서 로드
      const apps = await getApplicationsByEventId(eventId);
      const appsWithUsers = await Promise.all(
        apps.map(async (app) => {
          try {
            const userData = await getUser(app.uid);
            return { ...app, user: userData || undefined };
          } catch (userError) {
            console.error(`사용자 ${app.uid} 정보 로드 실패:`, userError);
            return { ...app, user: undefined };
          }
        })
      );
      setApplications(appsWithUsers);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
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

  const handleApprove = async (app: Application & { docId?: string }) => {
    if (!confirm("이 지원자를 승인하시겠습니까?")) return;
    try {
      const docId = app.docId || app.uid;
      await updateApplicationStatus(docId, "approved");
      await loadData();
      alert("승인되었습니다.");
    } catch (error: any) {
      console.error("승인 실패:", error);
      alert(`승인에 실패했습니다: ${error?.message || error}`);
    }
  };

  const handleReject = async (app: Application & { docId?: string }) => {
    if (!confirm("이 지원자를 거절하시겠습니까?")) return;
    try {
      const docId = app.docId || app.uid;
      await updateApplicationStatus(docId, "rejected");
      await loadData();
      alert("거절되었습니다.");
    } catch (error: any) {
      console.error("거절 실패:", error);
      alert(`거절에 실패했습니다: ${error?.message || error}`);
    }
  };

  const handlePaid = async (app: Application & { docId?: string }) => {
    if (!confirm("입금 완료로 변경하시겠습니까?")) return;
    try {
      const docId = app.docId || app.uid;
      await updateApplicationStatus(docId, "paid");
      await loadData();
      alert("입금 완료로 변경되었습니다.");
    } catch (error: any) {
      console.error("입금 완료 변경 실패:", error);
      alert(`입금 완료 변경에 실패했습니다: ${error?.message || error}`);
    }
  };

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

  // 종료된 모임이면 투표 결과 로드
  const checkAndLoadVotes = async () => {
    if (!event || !eventId) return;
    
    if (isEventEnded(event)) {
      setVotesLoading(true);
      try {
        const allVotes = await getAllLikesForEvent(eventId);
        
        // 투표자와 투표 대상 정보 가져오기
        const votesWithUsers = await Promise.all(
          allVotes.map(async (vote) => {
            const voter = await getUser(vote.uid);
            const firstTarget = vote.first ? await getUser(vote.first).catch(() => null) : null;
            const secondTarget = vote.second ? await getUser(vote.second).catch(() => null) : null;
            const thirdTarget = vote.third ? await getUser(vote.third).catch(() => null) : null;
            
            return {
              ...vote,
              voter: voter || undefined,
              firstTarget: firstTarget || undefined,
              secondTarget: secondTarget || undefined,
              thirdTarget: thirdTarget || undefined,
            };
          })
        );
        
        setVotes(votesWithUsers);
      } catch (error) {
        console.error("투표 결과 로드 실패:", error);
      } finally {
        setVotesLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">행사를 찾을 수 없습니다.</p>
          <Link
            href="/admin"
            className="bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground pt-4 pb-8 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link
              href="/admin"
              className="text-primary hover:underline mb-2 inline-block"
            >
              ← 행사 관리로 돌아가기
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
              {event.title}
            </h1>
            <div className="mt-4 space-y-2 text-gray-700">
              <p>
                <span className="font-semibold">일시:</span>{" "}
                {new Date(event.date).toLocaleString("ko-KR")}
              </p>
              <p>
                <span className="font-semibold">장소:</span> {event.location}
              </p>
              <p>
                <span className="font-semibold">최대 인원:</span> {event.maxParticipants}명
              </p>
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="card-elegant p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="이름/직업 검색"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-elegant"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="input-elegant"
            >
              <option value="all">전체 상태</option>
              <option value="pending">심사 중</option>
              <option value="approved">승인됨</option>
              <option value="paid">입금 완료</option>
              <option value="rejected">거절됨</option>
            </select>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value as any })}
              className="input-elegant"
            >
              <option value="all">전체 성별</option>
              <option value="M">남성</option>
              <option value="F">여성</option>
            </select>
          </div>
        </div>

        {/* 투표 결과 (종료된 모임만) */}
        {event && isEventEnded(event) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
              투표 결과 ({votes.length}명 투표)
            </h2>
            {votesLoading ? (
              <div className="card-elegant p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">투표 결과를 불러오는 중...</p>
              </div>
            ) : votes.length === 0 ? (
              <div className="card-elegant p-8 text-center text-gray-600">
                아직 투표가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {votes.map((vote) => (
                  <div key={vote.uid} className="card-elegant p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {vote.voter?.name || "이름 없음"} ({vote.voter?.gender === "M" ? "남성" : "여성"})
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 w-16">1순위:</span>
                        <span className={vote.first ? "text-gray-800" : "text-gray-400 italic"}>
                          {vote.first 
                            ? (vote.firstTarget?.name || "사용자 정보 없음")
                            : "없음"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 w-16">2순위:</span>
                        <span className={vote.second ? "text-gray-800" : "text-gray-400 italic"}>
                          {vote.second 
                            ? (vote.secondTarget?.name || "사용자 정보 없음")
                            : "없음"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 w-16">3순위:</span>
                        <span className={vote.third ? "text-gray-800" : "text-gray-400 italic"}>
                          {vote.third 
                            ? (vote.thirdTarget?.name || "사용자 정보 없음")
                            : "없음"}
                        </span>
                      </div>
                      {vote.message && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="font-semibold text-gray-700">하고 싶은 말:</span>
                          <p className="text-gray-600 mt-1">{vote.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 지원자 목록 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">지원자 리스트 ({filteredApplications.length}명)</h2>
          <div className="space-y-4">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-600 card-elegant">
                {applications.length === 0 
                  ? "이 행사에 지원한 지원자가 없습니다." 
                  : "필터 조건에 맞는 지원자가 없습니다."}
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div
                  key={app.docId || app.uid}
                  className="card-elegant card-hover p-6 cursor-pointer hover:bg-gradient-to-r hover:from-primary hover:to-[#0d4a1a] group transition-all duration-300"
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold group-hover:text-white transition">{app.user?.name || "이름 없음"}</p>
                      <p className="text-sm text-gray-700 group-hover:text-white transition">
                        {app.user?.gender === "M" ? "남성" : "여성"} | {app.user?.age}세 | {app.job}
                      </p>
                      <p className="text-sm text-gray-600 group-hover:text-white mt-1 transition">
                        상태: {
                          app.status === "pending" ? "심사 중" : 
                          app.status === "approved" ? "승인됨" : 
                          app.status === "paid" ? "입금 완료" : 
                          "거절됨"
                        }
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {app.status === "pending" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(app);
                            }}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                          >
                            승인
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(app);
                            }}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                          >
                            거절
                          </button>
                        </>
                      )}
                      {app.status === "approved" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePaid(app);
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                          >
                            입금 완료
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(app);
                            }}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                          >
                            거절
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 상세 정보 모달 */}
        {selectedApp && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setSelectedApp(null)}
          >
            <div
              className="card-elegant p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">지원서 상세</h2>
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
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(photo, '_blank');
                            }}
                            className="bg-white text-gray-800 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-200 transition"
                          >
                            크게 보기
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement('a');
                              link.href = photo;
                              link.download = `photo_${index + 1}.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="bg-primary text-white px-3 py-1 rounded text-sm font-semibold hover:opacity-90 transition"
                          >
                            다운로드
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                {selectedApp.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      거절
                    </button>
                  </>
                )}
                {selectedApp.status === "approved" && (
                  <>
                    <button
                      onClick={() => {
                        handlePaid(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      입금 완료
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedApp);
                        setSelectedApp(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      거절
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedApp(null)}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
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

