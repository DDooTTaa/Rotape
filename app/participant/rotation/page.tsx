"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getProfilesByEvent } from "@/lib/firebase/profiles";
import { submitLike, getLike } from "@/lib/firebase/matching";
import { getUser } from "@/lib/firebase/users";
import { getEvent } from "@/lib/firebase/events";
import { getApplicationsByEventId, getApplication } from "@/lib/firebase/applications";
import { Profile, Event } from "@/lib/firebase/types";

export const dynamic = 'force-dynamic';

export default function RotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user] = useAuthState(auth!);
  const [profiles, setProfiles] = useState<Array<Profile & { nickname?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<"M" | "F" | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [isEventEnded, setIsEventEnded] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [canVote, setCanVote] = useState(false);

  const [selections, setSelections] = useState({
    first: "",
    second: "",
    third: "",
    message: "",
  });

  useEffect(() => {
    const eventIdParam = searchParams.get("eventId");
    if (eventIdParam) {
      setEventId(eventIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && eventId) {
      loadEventData();
      loadUserData();
      checkExistingLike();
    }
  }, [user, eventId]);

  useEffect(() => {
    if (user && eventId && userGender && canVote) {
      loadProfiles();
    }
  }, [user, eventId, userGender, canVote]);

  // 종료 시간이 지났는지 실시간으로 확인
  useEffect(() => {
    if (!event) return;

    const checkEventEndTime = () => {
      const now = new Date();
      let eventEnded = false;

      // 종료 시간 계산
      let endTime: Date | null = null;

      // endTime 필드가 있으면 사용
      if (event.endTime) {
        endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
      } else if (event.schedule?.part2) {
        // schedule.part2에서 종료 시간 추출 (예: "17:00")
        const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
        const timeStr = event.schedule.part2.trim();
        const [hours, minutes] = timeStr.split(':').map(Number);

        if (!isNaN(hours) && !isNaN(minutes)) {
          endTime = new Date(eventDate);
          endTime.setHours(hours, minutes || 0, 0, 0);
        }
      }

      // 종료 시간이 있으면 종료 시간 기준으로 판단, 없으면 날짜만 비교
      if (endTime) {
        eventEnded = now.getTime() >= endTime.getTime();
      } else {
        // 종료 시간이 없으면 날짜만 비교
        const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        eventEnded = eventDateOnly.getTime() < todayOnly.getTime();
      }

      setIsEventEnded(eventEnded);
      // 입금 완료 상태이고 행사가 끝난 경우만 투표 가능
      setCanVote(isPaid && eventEnded);
    };

    // 즉시 확인
    checkEventEndTime();

    // 1분마다 종료 시간 확인
    const interval = setInterval(checkEventEndTime, 60000);

    return () => clearInterval(interval);
  }, [event, isPaid]);

  const loadEventData = async () => {
    if (!eventId || !user) return;
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);

      // 사용자의 지원서 상태 확인
      const userApplication = await getApplication(user.uid, eventId);
      const paid = userApplication?.status === "paid";
      setIsPaid(paid);

      if (eventData) {
        const now = new Date();
        let eventEnded = false;

        // 종료 시간 계산
        let endTime: Date | null = null;

        // endTime 필드가 있으면 사용
        if (eventData.endTime) {
          endTime = eventData.endTime instanceof Date ? eventData.endTime : new Date(eventData.endTime);
        } else if (eventData.schedule?.part2) {
          // schedule.part2에서 종료 시간 추출 (예: "17:00")
          const eventDate = eventData.date instanceof Date ? eventData.date : new Date(eventData.date);
          const timeStr = eventData.schedule.part2.trim();
          const [hours, minutes] = timeStr.split(':').map(Number);

          if (!isNaN(hours) && !isNaN(minutes)) {
            endTime = new Date(eventDate);
            endTime.setHours(hours, minutes || 0, 0, 0);
          }
        }

        // 종료 시간이 있으면 종료 시간 기준으로 판단, 없으면 날짜만 비교
        if (endTime) {
          eventEnded = now.getTime() >= endTime.getTime();
        } else {
          // 종료 시간이 없으면 날짜만 비교
          const eventDate = eventData.date instanceof Date ? eventData.date : new Date(eventData.date);
          const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
          const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          eventEnded = eventDateOnly.getTime() < todayOnly.getTime();
        }

        setIsEventEnded(eventEnded);
        // 입금 완료 상태이고 행사가 끝난 경우만 투표 가능
        setCanVote(paid && eventEnded);
      }
    } catch (error) {
      console.error("행사 정보 로드 실패:", error);
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    try {
      const userData = await getUser(user.uid);
      if (userData?.gender) {
        setUserGender(userData.gender);
      }
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);
    }
  };

  const checkExistingLike = async () => {
    if (!user || !eventId) return;
    try {
      const existingLike = await getLike(user.uid, eventId);
      if (existingLike) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("기존 투표 확인 실패:", error);
    }
  };

  const loadProfiles = async () => {
    if (!user || !eventId || !userGender) {
      console.log("loadProfiles 조건 불만족:", { user: !!user, eventId, userGender });
      return;
    }

    try {
      console.log("프로필 로드 시작:", { eventId, userGender, userId: user.uid });

      // 승인된 지원서만 가져오기
      const applications = await getApplicationsByEventId(eventId);
      console.log("전체 지원서 수:", applications.length);

      const approvedApplications = applications.filter(app => app.status === "approved" || app.status === "paid");
      console.log("승인된 지원서 수:", approvedApplications.length);
      console.log("승인된 지원서 UIDs:", approvedApplications.map(app => app.uid));

      // 승인된 사용자의 프로필 가져오기
      const profilesData = await getProfilesByEvent(eventId);
      console.log("전체 프로필 수:", profilesData.length);
      console.log("전체 프로필 UIDs:", profilesData.map(p => p.uid));

      const approvedUids = new Set(approvedApplications.map(app => app.uid));
      const approvedProfiles = profilesData.filter(p => approvedUids.has(p.uid));
      console.log("승인된 프로필 수:", approvedProfiles.length);
      console.log("승인된 프로필 UIDs:", approvedProfiles.map(p => p.uid));

      // 이성 프로필만 필터링하고 Application에서 닉네임 가져오기
      const profilesWithUserInfo = await Promise.all(
        approvedProfiles.map(async (p) => {
          try {
            const profileUser = await getUser(p.uid);
            // Application에서 닉네임 찾기
            const userApplication = approvedApplications.find(app => app.uid === p.uid);
            const nickname = userApplication?.nickname;

            console.log(`프로필 ${p.uid}의 정보:`, {
              nickname: nickname,
              name: profileUser?.name,
              gender: profileUser?.gender
            });

            return {
              profile: p,
              gender: profileUser?.gender,
              nickname: nickname || profileUser?.name
            };
          } catch (error) {
            console.error(`사용자 ${p.uid} 정보 가져오기 실패:`, error);
            return { profile: p, gender: null, nickname: undefined };
          }
        })
      );

      console.log("사용자 정보 포함 프로필:", profilesWithUserInfo.map(({ profile, gender, nickname }) => ({
        profileName: profile.displayName,
        nickname: nickname,
        uid: profile.uid,
        gender
      })));

      const otherGenderProfiles = profilesWithUserInfo
        .filter(({ gender, profile }) => {
          const isOtherGender = gender && gender !== userGender;
          const isNotSelf = profile.uid !== user?.uid;
          console.log(`프로필 ${profile.uid}: isOtherGender=${isOtherGender}, isNotSelf=${isNotSelf}`);
          return isOtherGender && isNotSelf;
        })
        .map(({ profile, nickname }) => ({ ...profile, nickname }));

      console.log("최종 이성 프로필 수:", otherGenderProfiles.length);
      console.log("최종 이성 프로필 목록:", otherGenderProfiles.map(p => ({
        profileName: p.displayName,
        nickname: p.nickname,
        uid: p.uid
      })));

      setProfiles(otherGenderProfiles);
    } catch (error) {
      console.error("프로필 로드 실패:", error);
      alert("프로필을 불러오는데 실패했습니다. 콘솔을 확인해주세요.");
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eventId) return;

    // 행사 종료 여부 확인
    if (!isEventEnded) {
      alert("행사가 종료된 후에 투표할 수 있습니다.");
      return;
    }

    // 없음을 선택한 경우도 허용하므로 검증 제거

    setLoading(true);
    try {
      await submitLike(user.uid, eventId, {
        first: selections.first,
        second: selections.second,
        third: selections.third,
        message: selections.message,
      });

      setSubmitted(true);
    } catch (error) {
      console.error("제출 실패:", error);
      alert("제출에 실패했습니다.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="text-6xl mb-4 text-primary">✓</div>
            <h1 className="text-3xl font-bold mb-4">제출 완료</h1>
            <p className="text-gray-700 mb-6">
              선택이 완료되었습니다.
            </p>
            <button
              onClick={() => router.push("/participant/events")}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              행사 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 입금 완료 상태가 아니거나 행사가 종료되지 않았으면 안내 메시지 표시
  if (!canVote) {
    let message = "";
    let title = "";
    
    if (!isPaid) {
      title = "투표할 수 없습니다.";
      message = "행사가 종료된 모임만 투표할 수 있습니다.";
    } else if (!isEventEnded) {
      title = "아직 투표 시간이 아닙니다";
      message = "행사가 종료된 후에 투표할 수 있습니다.";
    } else {
      title = "투표할 수 없습니다";
      message = "행사가 종료된 모임만 투표할 수 있습니다.";
    }
    
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="text-6xl mb-4 text-primary">⏰</div>
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <p className="text-gray-700 mb-6">
              {message}
            </p>
            <button
              onClick={() => router.push("/participant/events")}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              행사 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">1, 2, 3순위 선택하기</h1>
          <p className="text-gray-600 mt-2">행사가 종료되었습니다. 이성 중에서 Top 1, 2, 3을 선택해주세요.</p>

          {/* 모임 상세 정보 */}
          {event && (
            <div className="mt-6 bg-gradient-to-r from-primary/10 to-[#0d4a1a]/10 border-2 border-primary/30 rounded-lg p-4">
              <h2 className="text-xl font-bold text-primary mb-3">{event.title}</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">일시:</span>{" "}
                  {event.date instanceof Date
                    ? event.date.toLocaleString("ko-KR")
                    : new Date(event.date).toLocaleString("ko-KR")}
                </p>
                <p>
                  <span className="font-semibold">장소:</span> {event.location}
                </p>
              </div>
            </div>
          )}
        </div>

        {profiles.length === 0 ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-800 font-semibold mb-2">투표할 이성이 없습니다.</p>
            <p className="text-yellow-700 text-sm">
              승인된 이성 참가자가 없거나, 프로필이 아직 생성되지 않았을 수 있습니다.
            </p>
            <p className="text-yellow-600 text-xs mt-2">
              콘솔을 확인하여 디버깅 정보를 확인해주세요.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1순위 */}
            <div>
              <label className="block mb-2 font-semibold text-gray-800">1순위</label>
              <select
                value={selections.first}
                onChange={(e) => setSelections({ ...selections, first: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
              >
                <option value="">없음</option>
                {profiles.map((profile) => (
                  <option key={profile.uid} value={profile.uid}>
                    {profile.nickname || profile.displayName || "이름 없음"}
                  </option>
                ))}
              </select>
            </div>

            {/* 2순위 */}
            <div>
              <label className="block mb-2 font-semibold text-gray-800">2순위</label>
              <select
                value={selections.second}
                onChange={(e) => setSelections({ ...selections, second: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
              >
                <option value="">없음</option>
                {profiles
                  .filter((p) => p.uid !== selections.first || selections.first === "")
                  .map((profile) => (
                    <option key={profile.uid} value={profile.uid}>
                      {profile.nickname || profile.displayName || "이름 없음"}
                    </option>
                  ))}
              </select>
            </div>

            {/* 3순위 */}
            <div>
              <label className="block mb-2 font-semibold text-gray-800">3순위</label>
              <select
                value={selections.third}
                onChange={(e) => setSelections({ ...selections, third: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
              >
                <option value="">없음</option>
                {profiles
                  .filter((p) =>
                    (selections.first === "" || p.uid !== selections.first) &&
                    (selections.second === "" || p.uid !== selections.second)
                  )
                  .map((profile) => (
                    <option key={profile.uid} value={profile.uid}>
                      {profile.nickname || profile.displayName || "이름 없음"}
                    </option>
                  ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white px-6 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "제출 중..." : "제출하기"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

