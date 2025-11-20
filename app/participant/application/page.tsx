"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { createApplication } from "@/lib/firebase/applications";
import { uploadPhoto } from "@/lib/firebase/storage";

const loveLanguages = ["행동", "선물", "언어", "시간", "스킨십"];

export default function ApplicationPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  
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
      // 사진 업로드
      const photoUrls: string[] = [];
      for (let i = 0; i < formData.photos.length; i++) {
        const url = await uploadPhoto(user.uid, formData.photos[i], i);
        photoUrls.push(url);
      }

      // 지원서 제출
      await createApplication(user.uid, {
        height: parseInt(formData.height),
        job: formData.job,
        intro: formData.intro,
        idealType: formData.idealType,
        loveStyle: formData.loveStyle,
        loveLanguage: formData.loveLanguage,
        photos: photoUrls,
      });

      router.push("/participant/pending");
    } catch (error) {
      console.error("지원서 제출 실패:", error);
      alert("지원서 제출에 실패했습니다.");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-deep-green text-foreground flex items-center justify-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-green text-foreground py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">지원서 작성</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 */}
          <div>
            <label className="block mb-2 font-semibold">이름</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-primary/20 text-foreground border border-primary/30"
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
              className="w-full px-4 py-2 rounded-lg bg-primary/20 text-foreground border border-primary/30"
            />
            {formData.birthYear && (
              <p className="text-sm mt-1 text-gray-300">나이: {calculateAge(formData.birthYear)}세</p>
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
              className="w-full px-4 py-2 rounded-lg bg-primary/20 text-foreground border border-primary/30"
            />
            {formData.gender === "M" && formData.height && parseInt(formData.height) < 170 && (
              <p className="text-sm mt-1 text-yellow-400">키가 170cm 미만입니다.</p>
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
              className="w-full px-4 py-2 rounded-lg bg-primary/20 text-foreground border border-primary/30"
            />
          </div>

          {/* 사진 업로드 */}
          <div>
            <label className="block mb-2 font-semibold">사진 업로드 (3장 필수)</label>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="border-2 border-dashed border-primary/30 rounded-lg p-4">
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
                      <span className="text-sm text-primary">✓ 업로드됨</span>
                    ) : (
                      <span className="text-sm">+ 사진 추가</span>
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
              className="w-full px-4 py-2 rounded-lg bg-primary/20 text-foreground border border-primary/30"
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
              className="w-full px-4 py-2 rounded-lg bg-primary/20 text-foreground border border-primary/30"
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
              className="w-full px-4 py-2 rounded-lg bg-primary/20 text-foreground border border-primary/30"
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
                    <span className="ml-2 text-primary">
                      ({formData.loveLanguage.indexOf(lang) + 1}순위)
                    </span>
                  )}
                </label>
              ))}
            </div>
            <p className="text-sm mt-2 text-gray-300">
              선택된 순서대로 순위가 결정됩니다. (5개 모두 선택 필요)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-deep-green px-6 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "제출 중..." : "제출하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

