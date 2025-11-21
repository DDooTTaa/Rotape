"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { createApplication } from "@/lib/firebase/applications";
import { uploadPhoto } from "@/lib/firebase/storage";
import { getEvent } from "@/lib/firebase/events";

export const dynamic = 'force-dynamic';

const loveLanguages = ["행동", "선물", "언어", "시간", "스킨십"];

function ApplicationFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user] = useAuthState(auth!);
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "",
    gender: "M" as "M" | "F",
    birthYear: "",
    height: "",
    job: "",
    intro: "",
    idealType: "",
    loveStyle: "",
    loveLanguage: [] as string[],
    photos: [] as File[],
  });

  useEffect(() => {
    const eventIdParam = searchParams.get("eventId");
    if (eventIdParam) {
      setEventId(eventIdParam);
      loadEventInfo(eventIdParam);
    }
  }, [searchParams]);

  const loadEventInfo = async (id: string) => {
    try {
      const event = await getEvent(id);
      if (event) {
        setEventTitle(event.title);
      }
    } catch (error) {
      console.error("행사 정보 로드 실패:", error);
    }
  };

  const calculateAge = (birthYear: string): number => {
    if (!birthYear) return 0;
    const year = parseInt(birthYear);
    return new Date().getFullYear() - year;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPhotos = [...formData.photos];
      newPhotos[index] = file;
      setFormData({ ...formData, photos: newPhotos });
    }
  };

  const handleLoveLanguageChange = (lang: string) => {
    if (formData.loveLanguage.includes(lang)) {
      setFormData({
        ...formData,
        loveLanguage: formData.loveLanguage.filter((l) => l !== lang),
      });
    } else if (formData.loveLanguage.length < 5) {
      setFormData({
        ...formData,
        loveLanguage: [...formData.loveLanguage, lang],
      });
    }
  };

  const handleLogout = async () => {
    if (!auth) {
      alert("인증 서비스를 사용할 수 없습니다.");
      return;
    }
    try {
      await signOut(auth!);
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (formData.photos.length < 3) {
      alert("사진 3장을 모두 업로드해주세요.");
      return;
    }

    if (formData.loveLanguage.length !== 5) {
      alert("사랑의 언어를 5개 모두 선택해주세요.");
      return;
    }

    // 키 체크 (남성 170 미만 시 안내)
    if (formData.gender === "M" && parseInt(formData.height) < 170) {
      if (!confirm("키가 170cm 미만입니다. 계속 진행하시겠습니까?")) {
        return;
      }
    }

    setLoading(true);

    try {
      console.log("지원서 제출 시작...");
      
      // 사진 업로드
      console.log("사진 업로드 시작...");
      const photoUrls: string[] = [];
      try {
        for (let i = 0; i < formData.photos.length; i++) {
          console.log(`사진 ${i + 1} 업로드 중...`);
          const url = await uploadPhoto(user.uid, formData.photos[i], i);
          photoUrls.push(url);
          console.log(`사진 ${i + 1} 업로드 완료:`, url);
        }
        console.log("모든 사진 업로드 완료");
      } catch (photoError: any) {
        console.error("사진 업로드 실패:", photoError);
        throw new Error(`사진 업로드 실패: ${photoError?.message || photoError}`);
      }

      // 사용자 정보 업데이트
      console.log("사용자 정보 업데이트 시작...");
      try {
        const { updateUser } = await import("@/lib/firebase/users");
        await updateUser(user.uid, {
          name: formData.name,
          gender: formData.gender,
          birthday: formData.birthYear,
          age: calculateAge(formData.birthYear),
        });
        console.log("사용자 정보 업데이트 완료");
      } catch (userError: any) {
        console.error("사용자 정보 업데이트 실패:", userError);
        throw new Error(`사용자 정보 업데이트 실패: ${userError?.message || userError}`);
      }

      // 지원서 제출 (eventId가 있으면 행사별 지원서로 생성)
      console.log("지원서 제출 시작...");
      try {
        await createApplication(
          user.uid,
          {
            height: parseInt(formData.height),
            job: formData.job,
            intro: formData.intro,
            idealType: formData.idealType,
            loveStyle: formData.loveStyle,
            loveLanguage: formData.loveLanguage,
            photos: photoUrls,
          },
          eventId || undefined
        );
        console.log("지원서 제출 완료");
      } catch (appError: any) {
        console.error("지원서 제출 실패:", appError);
        throw new Error(`지원서 제출 실패: ${appError?.message || appError}`);
      }

      console.log("모든 프로세스 완료");
      router.push("/participant/events");
    } catch (error: any) {
      console.error("지원서 제출 실패:", error);
      console.error("에러 코드:", error?.code);
      console.error("에러 메시지:", error?.message);
      console.error("전체 에러:", error);
      
      let errorMessage = "지원서 제출에 실패했습니다.";
      
      if (error?.message?.includes("사진 업로드 실패")) {
        errorMessage = `사진 업로드에 실패했습니다.\n${error.message}`;
      } else if (error?.message?.includes("사용자 정보 업데이트 실패")) {
        errorMessage = `사용자 정보 업데이트에 실패했습니다.\n${error.message}`;
      } else if (error?.message?.includes("지원서 제출 실패")) {
        errorMessage = `지원서 제출에 실패했습니다.\n${error.message}`;
      } else if (error?.code === "permission-denied" || error?.message?.includes("permission")) {
        errorMessage = "권한이 없습니다. Firebase 보안 규칙을 확인해주세요.\n브라우저 콘솔을 확인하세요.";
      } else if (error?.message?.includes("Cross-Origin")) {
        errorMessage = "인증 오류가 발생했습니다. 페이지를 새로고침하고 다시 시도해주세요.";
      } else if (error?.message) {
        errorMessage = `오류: ${error.message}\n브라우저 콘솔(F12)을 확인하세요.`;
      }
      
      alert(errorMessage);
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">지원서 작성</h1>
            {eventTitle && (
              <p className="text-lg text-primary mt-2">행사: {eventTitle}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            로그아웃
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 */}
          <div>
            <label className="block mb-2 font-semibold">이름</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="block mb-2 font-semibold">성별</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="M"
                  checked={formData.gender === "M"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "M" | "F" })}
                  className="mr-2"
                />
                남성
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="F"
                  checked={formData.gender === "F"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "M" | "F" })}
                  className="mr-2"
                />
                여성
              </label>
            </div>
          </div>

          {/* 생년 */}
          <div>
            <label className="block mb-2 font-semibold">생년</label>
            <input
              type="number"
              required
              min="1984"
              max="2004"
              value={formData.birthYear}
              onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
            />
            {formData.birthYear && (
              <p className="text-sm mt-1 text-gray-600">나이: {calculateAge(formData.birthYear)}세</p>
            )}
          </div>

          {/* 키 */}
          <div>
            <label className="block mb-2 font-semibold">키 (cm)</label>
            <input
              type="number"
              required
              min="140"
              max="220"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
            />
            {formData.gender === "M" && formData.height && parseInt(formData.height) < 170 && (
              <p className="text-sm mt-1 text-yellow-600">키가 170cm 미만입니다.</p>
            )}
          </div>

          {/* 직업 */}
          <div>
            <label className="block mb-2 font-semibold">직업</label>
            <input
              type="text"
              required
              value={formData.job}
              onChange={(e) => setFormData({ ...formData, job: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
            />
          </div>

          {/* 사진 업로드 */}
          <div>
            <label className="block mb-2 font-semibold">사진 업로드 (3장 필수)</label>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="border-2 border-dashed border-primary rounded-lg p-4 bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e, index)}
                    className="hidden"
                    id={`photo-${index}`}
                  />
                  <label
                    htmlFor={`photo-${index}`}
                    className="block text-center cursor-pointer"
                  >
                    {formData.photos[index] ? (
                      <span className="text-sm text-primary font-semibold">✓ 업로드됨</span>
                    ) : (
                      <span className="text-sm text-gray-600">+ 사진 추가</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 나를 한 줄로 소개 */}
          <div>
            <label className="block mb-2 font-semibold">나를 한 줄로 소개</label>
            <textarea
              required
              value={formData.intro}
              onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
              rows={2}
            />
          </div>

          {/* 이상형 한 줄 */}
          <div>
            <label className="block mb-2 font-semibold">이상형 한 줄</label>
            <textarea
              required
              value={formData.idealType}
              onChange={(e) => setFormData({ ...formData, idealType: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
              rows={2}
            />
          </div>

          {/* 어떤 연애를 하고 싶은가요 */}
          <div>
            <label className="block mb-2 font-semibold">어떤 연애를 하고 싶은가요?</label>
            <textarea
              required
              value={formData.loveStyle}
              onChange={(e) => setFormData({ ...formData, loveStyle: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary"
              rows={2}
            />
          </div>

          {/* 사랑의 언어 */}
          <div>
            <label className="block mb-2 font-semibold">사랑의 언어 1~5 순위 선택</label>
            <div className="space-y-2">
              {loveLanguages.map((lang) => (
                <label key={lang} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.loveLanguage.includes(lang)}
                    onChange={() => handleLoveLanguageChange(lang)}
                    className="mr-2"
                  />
                  {lang}
                  {formData.loveLanguage.includes(lang) && (
                    <span className="ml-2 text-primary font-semibold">
                      ({formData.loveLanguage.indexOf(lang) + 1}순위)
                    </span>
                  )}
                </label>
              ))}
            </div>
            <p className="text-sm mt-2 text-gray-600">
              선택된 순서대로 순위가 결정됩니다. (5개 모두 선택 필요)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-6 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "제출 중..." : "제출하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ApplicationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ApplicationFormContent />
    </Suspense>
  );
}

