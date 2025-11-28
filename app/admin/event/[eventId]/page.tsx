"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getEvent } from "@/lib/firebase/events";
import { getApplicationsByEventId, updateApplicationStatus } from "@/lib/firebase/applications";
import { getProfile } from "@/lib/firebase/profiles";
import { getUser } from "@/lib/firebase/users";
import { getAllLikesForEvent } from "@/lib/firebase/matching";
import { Event, Application, User, Profile, Like } from "@/lib/firebase/types";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function EventDetailPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [applications, setApplications] = useState<(Application & { user?: User; docId?: string; profile?: Profile })[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<(Application & { user?: User; docId?: string; profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all" as "all" | "pending" | "approved" | "rejected",
    gender: "all" as "all" | "M" | "F",
  });
  const [selectedApp, setSelectedApp] = useState<(Application & { user?: User; profile?: Profile }) | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [voteStats, setVoteStats] = useState<Record<string, { first: number; second: number; third: number; total: number }>>({});
  const [voteResults, setVoteResults] = useState<Array<{ uid: string; stats: { first: number; second: number; third: number; total: number }; userData: User | null; profileData: Profile | null }>>([]);

  useEffect(() => {
    if (user && eventId) {
      loadData();
    }
  }, [user, eventId]);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  // 행사 상태 판단 함수
  const getEventStatus = (event: Event): 'past' | 'active' | 'upcoming' => {
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    const now = new Date();
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (eventDateOnly.getTime() < todayOnly.getTime()) {
      return 'past';
    } else if (eventDateOnly.getTime() === todayOnly.getTime()) {
      return 'active';
    } else {
      return 'upcoming';
    }
  };

  const loadData = async () => {
    if (!eventId) return;
    try {
      // 행사 정보 로드
      const eventData = await getEvent(eventId);
      setEvent(eventData);

      // 행사 상태 확인
      const eventStatus = eventData ? getEventStatus(eventData) : 'upcoming';
      
      // 지난 행사나 오늘 진행한 행사면 투표 결과 로드
      if (eventStatus === 'past' || eventStatus === 'active') {
        try {
          const likesData = await getAllLikesForEvent(eventId);
          setLikes(likesData);
          
          // 투표 통계 계산
          const stats: Record<string, { first: number; second: number; third: number; total: number }> = {};
          likesData.forEach(like => {
            // 1순위
            if (!stats[like.first]) {
              stats[like.first] = { first: 0, second: 0, third: 0, total: 0 };
            }
            stats[like.first].first++;
            stats[like.first].total += 3;
            
            // 2순위
            if (!stats[like.second]) {
              stats[like.second] = { first: 0, second: 0, third: 0, total: 0 };
            }
            stats[like.second].second++;
            stats[like.second].total += 2;
            
            // 3순위
            if (!stats[like.third]) {
              stats[like.third] = { first: 0, second: 0, third: 0, total: 0 };
            }
            stats[like.third].third++;
            stats[like.third].total += 1;
          });
          setVoteStats(stats);
          
          // 투표 결과 상세 정보 로드
          const results = await Promise.all(
            Object.entries(stats)
              .sort(([, a], [, b]) => b.total - a.total)
              .slice(0, 20)
              .map(async ([uid, stat]) => {
                const userData = await getUser(uid).catch(() => null);
                const profileData = await getProfile(uid).catch(() => null);
                return { uid, stats: stat, userData, profileData };
              })
          );
          setVoteResults(results);
        } catch (error) {
          console.error("투표 결과 로드 실패:", error);
        }
      }

      // 행사별 지원서 로드
      const apps = await getApplicationsByEventId(eventId);
      const appsWithUsers = await Promise.all(
        apps.map(async (app) => {
          try {
            const userData = await getUser(app.uid);
            // 프로필 정보도 함께 로드
            let profileData: Profile | undefined;
            try {
              profileData = await getProfile(app.uid) || undefined;
            } catch (profileError) {
              // 프로필이 없을 수 있으므로 에러는 무시
              console.log(`프로필 없음 (${app.uid})`);
            }
            return { ...app, user: userData || undefined, profile: profileData };
          } catch (userError) {
            console.error(`사용자 ${app.uid} 정보 로드 실패:`, userError);
            return { ...app, user: undefined, profile: undefined };
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
    <div className="min-h-screen text-foreground pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
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
                {event.date instanceof Date 
                  ? event.date.toLocaleString("ko-KR")
                  : new Date(event.date).toLocaleString("ko-KR")}
              </p>
              <p>
                <span className="font-semibold">장소:</span> {event.location}
              </p>
              <p>
                <span className="font-semibold">최대 인원:</span> {event.maxParticipants}명
              </p>
            </div>
          </div>
          {getEventStatus(event) !== 'past' && (
            <div className="ml-4">
              <Link
                href={`/admin/event/${eventId}/edit`}
                className="bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 inline-block"
              >
                행사 수정하기
              </Link>
            </div>
          )}
        </div>

        {/* 투표 결과 시각화 (지난 행사나 오늘 진행한 행사) */}
        {(getEventStatus(event) === 'past' || getEventStatus(event) === 'active') && (
          <div className="card-elegant p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">투표 결과</h2>
            {voteResults.length > 0 ? (
              <div className="space-y-4">
                {voteResults.map(({ uid, stats, userData, profileData }) => (
                <div key={uid} className="bg-white/70 border-2 border-primary/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {profileData?.photos && profileData.photos.length > 0 && (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden">
                          <Image
                            src={profileData.photos[0]}
                            alt={userData?.name || "이름 없음"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-lg">{userData?.name || "이름 없음"}</p>
                        <p className="text-sm text-gray-600">{profileData?.job || ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{stats.total}점</p>
                      <p className="text-xs text-gray-500">총점</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-yellow-100 rounded-lg p-2 text-center">
                      <p className="font-semibold text-yellow-800">1순위</p>
                      <p className="text-lg font-bold text-yellow-900">{stats.first}</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-2 text-center">
                      <p className="font-semibold text-blue-800">2순위</p>
                      <p className="text-lg font-bold text-blue-900">{stats.second}</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-2 text-center">
                      <p className="font-semibold text-green-800">3순위</p>
                      <p className="text-lg font-bold text-green-900">{stats.third}</p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <p className="text-lg">아직 투표 결과가 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* 필터 및 지원자 목록 (예정 행사 또는 진행중인 행사) */}
        {(getEventStatus(event) === 'upcoming' || getEventStatus(event) === 'active') && (
          <>
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
              filteredApplications.map((app) => {
                const isRejected = app.status === "rejected";
                const isApproved = app.status === "approved";
                const isPending = app.status === "pending";
                
                return (
                  <div
                    key={app.docId || app.uid}
                    className="card-elegant card-hover p-6 cursor-pointer hover:bg-gradient-to-r hover:from-primary hover:to-[#0d4a1a] group transition-all duration-300"
                    onClick={() => setSelectedApp(app)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold group-hover:text-white transition">
                            {app.user?.name || "이름 없음"}
                          </p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isRejected
                              ? "bg-red-200 text-red-800 border border-red-300"
                              : isApproved
                              ? "bg-green-200 text-green-800 border border-green-300"
                              : "bg-yellow-200 text-yellow-800 border border-yellow-300"
                          }`}>
                            {isPending ? "심사 중" : isApproved ? "승인됨" : "거절됨"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 group-hover:text-white transition">
                          {app.user?.gender === "M" ? "남성" : "여성"} | {app.user?.age}세 | {app.job}
                        </p>
                      </div>
                      <div className="flex gap-2">
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
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
            </div>
          </>
        )}

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
                  <p className="font-semibold">더 중요한 가치</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedApp.loveLanguage.map((lang, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                        {idx + 1}순위: {lang}
                      </span>
                    ))}
                  </div>
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
                
                {/* 프로필 정보 (있는 경우) */}
                {selectedApp.profile && (
                  <div className="mt-6 pt-6 border-t-2 border-primary/20">
                    <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
                      프로필 정보
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold mb-1">프로필 이름</p>
                        <p className="text-gray-700">{selectedApp.profile.displayName || "미입력"}</p>
                      </div>
                      {selectedApp.profile.photos && selectedApp.profile.photos.length > 0 && (
                        <div>
                          <p className="font-semibold mb-2">프로필 사진</p>
                          <div className="grid grid-cols-3 gap-4">
                            {selectedApp.profile.photos.map((photo, idx) => (
                              <div key={idx} className="relative aspect-square">
                                <Image
                                  src={photo}
                                  alt={`프로필 사진 ${idx + 1}`}
                                  fill
                                  className="object-cover rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedApp.profile.loveLanguage && selectedApp.profile.loveLanguage.length > 0 && (
                        <div>
                          <p className="font-semibold mb-1">더 중요한 가치 (프로필)</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedApp.profile.loveLanguage.map((lang, idx) => (
                              <span key={idx} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                                {idx + 1}순위: {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
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

