"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getProfile, getProfilesByEvent } from "@/lib/firebase/profiles";
import { getUser, updateUser } from "@/lib/firebase/users";
import { getEvent } from "@/lib/firebase/events";
import { getLike } from "@/lib/firebase/matching";
import { Profile, Event } from "@/lib/firebase/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TermsModal from "@/components/TermsModal";

export const dynamic = 'force-dynamic';

export default function EventPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [otherGenderProfiles, setOtherGenderProfiles] = useState<Profile[]>([]);
  const [userGender, setUserGender] = useState<"M" | "F" | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isEventEnded, setIsEventEnded] = useState(false);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

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
    };

    // 즉시 확인
    checkEventEndTime();

    // 1분마다 종료 시간 확인
    const interval = setInterval(checkEventEndTime, 60000);

    return () => clearInterval(interval);
  }, [event]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profileData = await getProfile(user.uid);
      setProfile(profileData);
      
      if (profileData) {
        // 행사 정보 로드
        const eventData = await getEvent(profileData.eventId);
        setEvent(eventData);
        
        // 행사가 끝났는지 확인 (종료 시간을 고려)
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
          
          // 투표 여부 확인
          try {
            const existingLike = await getLike(user.uid, profileData.eventId);
            setHasVoted(!!existingLike);
          } catch (error) {
            console.error("투표 확인 실패:", error);
          }
        }
        
        // 사용자 성별 확인 및 약관 동의 상태 확인
        const userData = await getUser(user.uid);
        if (userData) {
          // 약관 동의 상태 확인
          setTermsAccepted(userData.termsAccepted ?? false);
          
          if (userData.gender) {
            setUserGender(userData.gender);
            
            // 같은 행사의 다른 성별 프로필 가져오기
            const allProfiles = await getProfilesByEvent(profileData.eventId);
            const otherProfiles = allProfiles.filter(p => {
              // 프로필의 uid로 사용자 정보를 가져와서 성별 확인
              return p.uid !== user.uid;
            });
            
            // 각 프로필의 사용자 정보를 가져와서 성별 필터링
            const profilesWithGender = await Promise.all(
              otherProfiles.map(async (p) => {
                try {
                  const profileUser = await getUser(p.uid);
                  return { profile: p, gender: profileUser?.gender };
                } catch {
                  return { profile: p, gender: null };
                }
              })
            );
            
            // 현재 사용자와 다른 성별의 프로필만 필터링
            const filtered = profilesWithGender
              .filter(({ gender }) => gender && gender !== userData.gender)
              .map(({ profile }) => profile);
            
            setOtherGenderProfiles(filtered);
            // 프로필이 로드되면 인덱스 초기화
            setCurrentProfileIndex(0);
          }
        }
      }
    } catch (error) {
      console.error("프로필 로드 실패:", error);
    }
  };


  const randomQuestions = [
    "가장 좋아하는 여행지는?",
    "스트레스를 받을 때 어떻게 해소하나요?",
    "이상적인 주말은?",
  ];

  const balanceGames = [
    { left: "집에서 쉬기", right: "밖에서 활동하기" },
    { left: "조용한 카페", right: "시끌벅적한 바" },
    { left: "계획적인 여행", right: "즉흥적인 여행" },
  ];

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">행사 대시보드</h1>
        </div>

        {/* 타임라인 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">오늘 일정</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
              <div>
                <p className="font-semibold text-gray-800">인트로 (14:00)</p>
                <p className="text-sm text-gray-600">행사 소개 및 안내</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
              <div>
                <p className="font-semibold text-gray-800">1부 로테이션 (14:30)</p>
                <p className="text-sm text-gray-600">라운드 1-3</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-4"></div>
              <div>
                <p className="font-semibold text-gray-800">쉬는 시간 (16:00)</p>
                <p className="text-sm text-gray-600">15분 휴식</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-4"></div>
              <div>
                <p className="font-semibold text-gray-800">2부 로테이션 (16:15)</p>
                <p className="text-sm text-gray-600">라운드 4-6</p>
              </div>
            </div>
          </div>
        </div>

        {/* 현재 라운드 또는 투표 */}
        {isEventEnded ? (
          <div className="bg-gradient-to-r from-primary/10 to-[#0d4a1a]/10 border-2 border-primary rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">모임이 종료되었습니다</h2>
            {hasVoted ? (
              <div>
                <p className="text-gray-700 mb-4">이미 투표를 완료하셨습니다.</p>
                <p className="text-sm text-gray-600">운영자가 결과를 공개할 때까지 기다려주세요.</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 mb-4">이성 중에서 Top 1, 2, 3을 선택해주세요.</p>
                {termsAccepted ? (
                  <Link
                    href={`/participant/rotation?eventId=${profile?.eventId}`}
                    className="inline-block bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
                  >
                    투표하기
                  </Link>
                ) : (
                  <div>
                    <p className="text-yellow-600 mb-4 font-semibold">투표하기 전에 약관 동의가 필요합니다.</p>
                    <button
                      onClick={() => setShowTermsModal(true)}
                      className="inline-block bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
                    >
                      약관 동의하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">현재 라운드</h2>
            <p className="text-3xl font-bold mb-2 text-gray-800">라운드 {currentRound}</p>
            <p className="text-gray-600 mb-4">다음 라운드까지 약 10분 남았습니다.</p>
            <Link
              href={`/participant/rotation?eventId=${profile?.eventId}`}
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              라운드 종료 후 선택하기
            </Link>
          </div>
        )}

        {/* 아이스브레이킹 툴 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">아이스브레이킹</h2>
          <div className="space-y-4">
            <button
              onClick={() => setShowIcebreaker(!showIcebreaker)}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {showIcebreaker ? "숨기기" : "랜덤 질문 보기"}
            </button>
            {showIcebreaker && (
              <div className="mt-4 space-y-4">
                <div className="bg-white border-2 border-primary rounded-lg p-4">
                  <p className="font-semibold mb-2 text-gray-800">랜덤 질문:</p>
                  <p className="text-gray-700">{randomQuestions[Math.floor(Math.random() * randomQuestions.length)]}</p>
                </div>
                <div className="bg-white border-2 border-primary rounded-lg p-4">
                  <p className="font-semibold mb-2 text-gray-800">밸런스 게임:</p>
                  {balanceGames[Math.floor(Math.random() * balanceGames.length)] && (
                    <div className="flex justify-between text-gray-700">
                      <span>{balanceGames[Math.floor(Math.random() * balanceGames.length)].left}</span>
                      <span className="text-primary font-bold">VS</span>
                      <span>{balanceGames[Math.floor(Math.random() * balanceGames.length)].right}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 진행 중인 모임일 때만 이성 프로필 케러셀 표시 */}
        {!isEventEnded && otherGenderProfiles.length > 0 && (
          <div className="bg-gray-100 border-2 border-primary rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              {userGender === "M" ? "여성" : "남성"} 참가자 프로필
            </h2>
            
            {/* 카드 케러셀 */}
            <div className="relative">
              {/* 현재 프로필 카드 */}
              {otherGenderProfiles[currentProfileIndex] && (
                <div
                  onClick={() => setSelectedProfile(otherGenderProfiles[currentProfileIndex])}
                  className="bg-white border-2 border-primary/30 rounded-xl p-6 cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300 card-hover"
                >
                  {otherGenderProfiles[currentProfileIndex].photos && 
                   otherGenderProfiles[currentProfileIndex].photos.length > 0 && (
                    <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={otherGenderProfiles[currentProfileIndex].photos[0]}
                        alt={otherGenderProfiles[currentProfileIndex].displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <p className="font-semibold text-gray-800 text-center text-xl mb-2">
                    {otherGenderProfiles[currentProfileIndex].displayName}
                  </p>
                  <p className="text-sm text-gray-600 text-center mb-3">
                    {otherGenderProfiles[currentProfileIndex].job}
                  </p>
                  {otherGenderProfiles[currentProfileIndex].intro && (
                    <p className="text-sm text-gray-700 text-center line-clamp-2">
                      {otherGenderProfiles[currentProfileIndex].intro}
                    </p>
                  )}
                </div>
              )}

              {/* 네비게이션 버튼 */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentProfileIndex((prev) => 
                      prev > 0 ? prev - 1 : otherGenderProfiles.length - 1
                    );
                  }}
                  disabled={otherGenderProfiles.length <= 1}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 이전
                </button>
                
                {/* 인디케이터 */}
                <div className="flex gap-2">
                  {otherGenderProfiles.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentProfileIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition ${
                        index === currentProfileIndex
                          ? "bg-primary w-8"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentProfileIndex((prev) => 
                      prev < otherGenderProfiles.length - 1 ? prev + 1 : 0
                    );
                  }}
                  disabled={otherGenderProfiles.length <= 1}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음 →
                </button>
              </div>

              {/* 카운터 */}
              <p className="text-center text-sm text-gray-600 mt-2">
                {currentProfileIndex + 1} / {otherGenderProfiles.length}
              </p>
            </div>
          </div>
        )}

        {/* 프로필 카드 보기 */}
        <div className="bg-gray-100 border-2 border-primary rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">프로필 카드</h2>
          <div className="space-y-4">
            <Link
              href="/participant/profile/view"
              className="block bg-primary text-white px-6 py-3 rounded-lg font-semibold text-center hover:opacity-90 transition"
            >
              QR 스캔하여 상대 프로필 조회
            </Link>
            <Link
              href="/participant/profile/my"
              className="block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-300 transition"
            >
              본인 프로필 재확인
            </Link>
          </div>
        </div>

        {/* 프로필 상세 모달 */}
        {selectedProfile && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            onClick={() => setSelectedProfile(null)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedProfile.displayName}</h2>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {selectedProfile.photos && selectedProfile.photos.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">사진</p>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedProfile.photos.map((photo, idx) => (
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
                  <p className="font-semibold mb-1">직업</p>
                  <p className="text-gray-700">{selectedProfile.job}</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">소개</p>
                  <p className="text-gray-700">{selectedProfile.intro}</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">더 중요한 가치</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.loveLanguage.map((lang, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                        {idx + 1}순위: {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 약관 동의 모달 */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={async () => {
          // 약관 동의 후 상태 업데이트
          if (user && termsAccepted === false) {
            try {
              await updateUser(user.uid, { termsAccepted: true });
              setTermsAccepted(true);
            } catch (error) {
              console.error("약관 동의 저장 실패:", error);
              alert("약관 동의 저장에 실패했습니다. 다시 시도해주세요.");
            }
          }
        }}
      />
    </div>
  );
}

