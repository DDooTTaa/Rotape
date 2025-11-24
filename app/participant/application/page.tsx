"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { createApplication, getApplication } from "@/lib/firebase/applications";
import { uploadPhoto } from "@/lib/firebase/storage";
import { getEvent } from "@/lib/firebase/events";
import { getUser } from "@/lib/firebase/users";
import Image from "next/image";

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
    height: "170", // 남성 기본값
    job: "",
    intro: "",
    idealType: "",
    loveStyle: "",
    loveLanguage: [] as string[],
    photos: [] as File[],
  });
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const eventIdParam = searchParams.get("eventId");
    if (eventIdParam) {
      setEventId(eventIdParam);
      loadEventInfo(eventIdParam);
    }
  }, [searchParams]);

  // 사용자 정보와 기존 지원서 정보 불러오기
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      try {
        setIsLoadingData(true);

        // 사용자 정보 불러오기
        const userData = await getUser(user.uid);
        if (userData) {
          // 생년월일에서 연도 추출 (YYYY-MM-DD 형식 또는 YYYY 형식)
          let birthYear = "";
          if (userData.birthday) {
            if (userData.birthday.includes("-")) {
              birthYear = userData.birthday.split("-")[0];
            } else if (userData.birthday.length === 4) {
              birthYear = userData.birthday;
            }
          }

          const userGender = userData.gender || "M";
          setFormData(prev => ({
            ...prev,
            name: userData.name || "",
            gender: userGender,
            birthYear: birthYear,
            // 남성이고 키가 비어있으면 170으로 설정
            height: prev.height || (userGender === "M" ? "170" : ""),
          }));
        }

        // 기존 지원서 정보 불러오기 (있다면)
        if (eventId) {
          const existingApplication = await getApplication(user.uid, eventId);
          if (existingApplication) {
            // 기존 지원서의 사진 URL을 미리보기로 설정
            if (existingApplication.photos && existingApplication.photos.length > 0) {
              setPhotoPreviews(existingApplication.photos);
            }

            setFormData(prev => ({
              ...prev,
              height: existingApplication.height?.toString() || "",
              job: existingApplication.job || "",
              intro: existingApplication.intro || "",
              idealType: existingApplication.idealType || "",
              loveStyle: existingApplication.loveStyle || "",
              loveLanguage: existingApplication.loveLanguage || [],
            }));
          } else {
            // 기존 지원서가 없으면, 다른 행사의 최근 지원서 정보를 참고
            // (선택사항: 사용자가 원하면 다른 행사의 지원서 정보도 불러올 수 있음)
          }
        }
      } catch (error) {
        console.error("사용자 정보 로드 실패:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadUserData();
  }, [user, eventId]);

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

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...photoPreviews];
        newPreviews[index] = reader.result as string;
        setPhotoPreviews(newPreviews);
      };
      reader.readAsDataURL(file);
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 사진 검증: 새로 업로드한 사진 + 기존 사진 URL 합쳐서 최소 2장 이상인지 확인
    const uploadedPhotos = formData.photos.filter(photo => photo !== undefined && photo !== null);
    const existingPhotoUrls = photoPreviews.filter(url => url && !url.startsWith('data:') && url.startsWith('http'));
    const totalPhotos = uploadedPhotos.length + existingPhotoUrls.length;

    if (totalPhotos < 2) {
      alert("사진을 최소 2장 이상 업로드해주세요.");
      return;
    }

    if (formData.loveLanguage.length !== 5) {
      alert("사랑의 언어를 5개 모두 선택해주세요.");
      return;
    }


    setLoading(true);

    try {
      console.log("지원서 제출 시작...");

      // 사진 처리: 새로 업로드한 사진은 업로드하고, 기존 URL은 그대로 사용
      console.log("사진 처리 시작...");
      const photoUrls: string[] = [];
      try {
        // 각 슬롯(0, 1, 2)에 대해 처리
        for (let i = 0; i < 3; i++) {
          const newPhoto = formData.photos[i];
          const existingUrl = photoPreviews[i];

          if (newPhoto && newPhoto instanceof File) {
            // 새로 업로드한 사진이 있으면 업로드
            console.log(`사진 ${i + 1} 업로드 중...`);
            const url = await uploadPhoto(user.uid, newPhoto, i);
            photoUrls.push(url);
            console.log(`사진 ${i + 1} 업로드 완료:`, url);
          } else if (existingUrl && existingUrl.startsWith('http')) {
            // 기존 URL이 있으면 그대로 사용 (새로 업로드한 사진이 없는 경우)
            photoUrls.push(existingUrl);
            console.log(`사진 ${i + 1} 기존 URL 사용:`, existingUrl);
          }
        }
        console.log("모든 사진 처리 완료:", photoUrls.length, "장");
      } catch (photoError: any) {
        console.error("사진 처리 실패:", photoError);
        throw new Error(`사진 처리 실패: ${photoError?.message || photoError}`);
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

  if (isLoadingData) {
    return (
      <div className="min-h-screen text-gray-800 pt-4 pb-8 md:py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-primary">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 pt-4 pb-8 md:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">지원서 작성</h1>
          {eventTitle && (
            <p className="text-lg text-primary mt-2 font-semibold">행사: {eventTitle}</p>
          )}
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
              placeholder="예: 홍길동"
              className="input-elegant"
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="block mb-3 font-semibold">성별</label>
            <div className="flex gap-3">
              {[
                { value: "M" as const, label: "남성" },
                { value: "F" as const, label: "여성" },
              ].map((option) => {
                const isSelected = formData.gender === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const newGender = option.value;
                      // 남성으로 변경 시 키가 비어있으면 170으로 설정
                      if (newGender === "M" && !formData.height) {
                        setFormData({ ...formData, gender: newGender, height: "170" });
                      } else {
                        setFormData({ ...formData, gender: newGender });
                      }
                    }}
                    className={`
                      flex-1 px-5 py-3 rounded-full font-semibold text-sm border-2
                      transition-colors
                      ${isSelected
                        ? 'bg-gradient-to-r from-primary to-[#0d4a1a] text-white shadow-lg border-primary'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-primary hover:bg-primary/5'
                      }
                      cursor-pointer
                    `}
                  >
                    {option.label}
                  </button>
                );
              })}
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
              placeholder="예: 1995"
              className="input-elegant"
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
              min="100"
              max="220"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              placeholder="예: 175"
              className="input-elegant"
            />
          </div>

          {/* 직업 */}
          <div>
            <label className="block mb-2 font-semibold">직업</label>
            <input
              type="text"
              required
              value={formData.job}
              onChange={(e) => setFormData({ ...formData, job: e.target.value })}
              placeholder="예: 개발자, 디자이너, 학생 등"
              className="input-elegant"
            />
          </div>

          {/* 사진 업로드 */}
          <div>
            <label className="block mb-2 font-semibold">사진 업로드 (2장 이상)</label>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="border-2 border-dashed border-primary rounded-xl bg-gray-50 relative overflow-hidden hover:border-primary/60 transition-all duration-300">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e, index)}
                    className="hidden"
                    id={`photo-${index}`}
                  />
                  {photoPreviews[index] ? (
                    <div className="relative w-full aspect-square">
                      <Image
                        src={photoPreviews[index]}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <label
                        htmlFor={`photo-${index}`}
                        className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      >
                        <span className="text-white text-sm font-semibold">변경</span>
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor={`photo-${index}`}
                      className="block w-full aspect-square flex items-center justify-center cursor-pointer"
                    >
                      <span className="text-sm text-gray-600">+ 사진 추가</span>
                    </label>
                  )}
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
              placeholder="예: 밝고 긍정적인 에너지로 함께하는 시간을 즐거움으로 만들어요"
              className="input-elegant"
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
              placeholder="예: 서로를 존중하고 이해할 수 있는 사람"
              className="input-elegant"
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
              placeholder="예: 함께 성장하고 서로를 응원하는 연애"
              className="input-elegant"
              rows={2}
            />
          </div>

          {/* 사랑의 언어 */}
          <div>
            <label className="block mb-3 font-semibold">연애에서 뭐가 제일 중요한가요?</label>
            <div className="flex flex-wrap gap-3">
              {loveLanguages.map((lang) => {
                const isSelected = formData.loveLanguage.includes(lang);
                const rank = isSelected ? formData.loveLanguage.indexOf(lang) + 1 : null;
                const isDisabled = !isSelected && formData.loveLanguage.length >= 5;

                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLoveLanguageChange(lang)}
                    disabled={isDisabled}
                    className={`
                      px-5 py-3 rounded-full font-semibold text-sm border-2
                      transition-colors
                      ${isSelected
                        ? 'bg-gradient-to-r from-primary to-[#0d4a1a] text-white shadow-lg border-primary'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-primary hover:bg-primary/5'
                      }
                      ${isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                      }
                    `}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex flex-wrap gap-2">
                {formData.loveLanguage.length == 0 && (
                  <span className="text-xs bg-white px-2 py-1 rounded-full border border-primary/30">
                    선택한 순서대로 순위가 결정됩니다. (5개 모두 선택해주세요)
                  </span>
                )}
                {formData.loveLanguage.map((lang, index) => (
                  <span key={lang} className="text-xs bg-white px-2 py-1 rounded-full border border-primary/30">
                    {index + 1}순위: {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
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

