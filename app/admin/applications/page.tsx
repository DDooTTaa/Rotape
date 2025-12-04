"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getAllApplications, updateApplicationStatus, assignNickname } from "@/lib/firebase/applications";
import { getUser } from "@/lib/firebase/users";
import { Application, User } from "@/lib/firebase/types";
import { useRouter } from "next/navigation";
import { sendSMS } from "@/lib/utils/sms";

export const dynamic = 'force-dynamic';

export default function ApplicationsPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [applications, setApplications] = useState<(Application & { user?: User; docId?: string })[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<(Application & { user?: User; docId?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all" as "all" | "pending" | "approved" | "rejected" | "paid",
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
      console.log("지원서 로드 시작...");
      const apps = await getAllApplications();
      console.log("조회된 지원서 개수:", apps.length);
      console.log("지원서 데이터:", apps);
      
      const appsWithUsers = await Promise.all(
        apps.map(async (app) => {
          try {
            const userData = await getUser(app.uid);
            console.log(`사용자 ${app.uid} 정보:`, userData);
            return { ...app, user: userData || undefined };
          } catch (userError) {
            console.error(`사용자 ${app.uid} 정보 로드 실패:`, userError);
            return { ...app, user: undefined };
          }
        })
      );
      console.log("최종 지원서 목록:", appsWithUsers);
      setApplications(appsWithUsers);
    } catch (error) {
      console.error("지원서 로드 실패:", error);
      alert("지원서를 불러오는 중 오류가 발생했습니다. 브라우저 콘솔을 확인해주세요.");
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

  const handleApprove = async (app: Application & { user?: User; docId?: string }) => {
    if (!confirm("이 지원자를 승인하시겠습니까?")) return;
    try {
      const docId = app.docId || app.uid; // docId가 있으면 사용, 없으면 uid 사용
      await updateApplicationStatus(docId, "approved");
      
      console.log(app);
      // 승인 완료 후 문자 발송
      try {
        // 전화번호 가져오기 (Application 또는 User에서)
        const phoneNumber = app.phone || app.user?.phone;
        
        if (phoneNumber) {
          const userName = app.user?.name || "고객";
          const smsResult = await sendSMS({
            to: phoneNumber,
            text: `[Rotape] 안녕하세요 ${userName}님!\n\n모임 참가 신청이 승인되었습니다.\n입금 안내는 별도로 전달드리겠습니다.\n\n감사합니다.`,
          });
          
          if (!smsResult.success) {
            console.error("문자 발송 실패:", smsResult.error);
            // 문자 발송 실패해도 승인은 완료되었으므로 경고만 표시
            alert(`승인되었습니다. 다만 문자 발송에 실패했습니다: ${smsResult.error}`);
            return;
          }
        } else {
          console.warn("전화번호가 없어 문자를 발송할 수 없습니다.");
        }
      } catch (smsError: any) {
        console.error("문자 발송 중 오류:", smsError);
        // 문자 발송 실패해도 승인은 완료되었으므로 경고만 표시
        alert(`승인되었습니다. 다만 문자 발송 중 오류가 발생했습니다: ${smsError?.message || smsError}`);
      }
      
      await loadApplications();
      alert("승인되었습니다.");
    } catch (error: any) {
      console.error("승인 실패:", error);
      alert(`승인에 실패했습니다: ${error?.message || error}`);
    }
  };

  const handleReject = async (app: Application & { docId?: string }) => {
    if (!confirm("이 지원자를 거절하시겠습니까?")) return;
    try {
      const docId = app.docId || app.uid; // docId가 있으면 사용, 없으면 uid 사용
      await updateApplicationStatus(docId, "rejected");
      await loadApplications();
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
      
      // 사용자 정보 가져오기
      const userData = await getUser(app.uid);
      
      // eventId가 있어야 닉네임 할당 가능
      if (app.eventId) {
        if (!userData?.gender) {
          alert("사용자 성별 정보가 없어 닉네임을 할당할 수 없습니다.");
          return;
        }
        
        // 닉네임이 없으면 할당
        if (!app.nickname) {
          const nickname = await assignNickname(docId, app.eventId, userData.gender);
          console.log(`닉네임 할당 완료: ${nickname}`);
        }
      }
      
      // 상태를 paid로 변경
      await updateApplicationStatus(docId, "paid");
      
      await loadApplications();
      alert("입금 완료로 변경되었습니다.");
    } catch (error: any) {
      console.error("입금 완료 변경 실패:", error);
      alert(`입금 완료 변경에 실패했습니다: ${error?.message || error}`);
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
    <div className="min-h-screen text-foreground pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">지원자 리스트</h1>
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

        {/* 지원자 목록 */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              {applications.length === 0 
                ? "지원서가 없습니다." 
                : "필터 조건에 맞는 지원서가 없습니다."}
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
                  {app.status === "rejected" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(app);
                      }}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      다시 승인
                    </button>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
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
                  <p className="font-semibold">더 중요한 가치</p>
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

