"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getLike } from "@/lib/firebase/matching";
import { getEvent } from "@/lib/firebase/events";
import { getApplication } from "@/lib/firebase/applications";
import { getUser } from "@/lib/firebase/users";
import { Like, Application, Event } from "@/lib/firebase/types";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';

interface VoteResult {
  rank: number;
  application: Application | null;
  uid: string;
  nickname?: string;
  displayName?: string;
}

export default function ResultsPage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  
  const [like, setLike] = useState<Like | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && eventId) {
      loadVoteResults();
    }
  }, [user, eventId]);

  const loadVoteResults = async () => {
    if (!user || !eventId) return;
    
    try {
      setLoading(true);
      
      // 행사 정보 가져오기
      const eventData = await getEvent(eventId);
      setEvent(eventData);
      
      // 사용자의 투표 내용 가져오기
      const userLike = await getLike(user.uid, eventId);
      
      if (!userLike) {
        setLoading(false);
        return;
      }
      
      setLike(userLike);
      
      // 각 순위에 선택한 사람의 지원서 및 닉네임 가져오기
      const results: VoteResult[] = [];
      
      // 1순위
      if (userLike.first) {
        try {
          const [application, userData] = await Promise.all([
            getApplication(userLike.first, eventId).catch(() => null),
            getUser(userLike.first).catch(() => null),
          ]);
          results.push({ 
            rank: 1, 
            application, 
            uid: userLike.first,
            nickname: application?.nickname,
            displayName: application?.nickname || userData?.name || "",
          });
        } catch (error) {
          console.error("1순위 지원서 로드 실패:", error);
          results.push({ rank: 1, application: null, uid: userLike.first });
        }
      }
      
      // 2순위
      if (userLike.second) {
        try {
          const [application, userData] = await Promise.all([
            getApplication(userLike.second, eventId).catch(() => null),
            getUser(userLike.second).catch(() => null),
          ]);
          results.push({ 
            rank: 2, 
            application, 
            uid: userLike.second,
            nickname: application?.nickname,
            displayName: application?.nickname || userData?.name || "",
          });
        } catch (error) {
          console.error("2순위 지원서 로드 실패:", error);
          results.push({ rank: 2, application: null, uid: userLike.second });
        }
      }
      
      // 3순위
      if (userLike.third) {
        try {
          const [application, userData] = await Promise.all([
            getApplication(userLike.third, eventId).catch(() => null),
            getUser(userLike.third).catch(() => null),
          ]);
          results.push({ 
            rank: 3, 
            application, 
            uid: userLike.third,
            nickname: application?.nickname,
            displayName: application?.nickname || userData?.name || "",
          });
        } catch (error) {
          console.error("3순위 지원서 로드 실패:", error);
          results.push({ rank: 3, application: null, uid: userLike.third });
        }
      }
      
      setVoteResults(results);
    } catch (error) {
      console.error("투표 결과 로드 실패:", error);
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

  if (!like) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">투표 결과</h1>
          <p className="text-gray-700 mb-6">
            아직 투표하지 않았습니다.
          </p>
          <button
            onClick={() => router.push("/participant/my-events")}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            내 모임으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  console.log(voteResults);

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
            내가 투표한 결과
          </h1>
          {event && (
            <p className="text-gray-600 mt-2">{event.title}</p>
          )}
        </div>
        {/* 투표한 순위별 결과 */}
        <div className="space-y-4 mb-6">
          {voteResults.map((result) => (
            <div
              key={result.rank}
              className="card-elegant card-hover p-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-r from-primary to-[#0d4a1a] flex items-center justify-center text-white font-bold text-xl">
                  {result.rank}
                </div>
                {result.application ? (
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {result.displayName || result.nickname || "이름 없음"}
                          </h3>
                          {result.nickname && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                              {result.nickname}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-1">직업: {result.application.job}</p>
                        <p className="text-gray-700 text-sm line-clamp-2">
                          {result.application.intro}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="text-gray-500">지원서 정보를 불러올 수 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 투표 메시지 */}
        {like.message && (
          <div className="card-elegant p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">남긴 메시지</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800 whitespace-pre-wrap">{like.message}</p>
            </div>
          </div>
        )}
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/participant/my-events")}
            className="bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            내 모임으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

