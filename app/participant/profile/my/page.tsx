"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getProfile } from "@/lib/firebase/profiles";
import { Profile } from "@/lib/firebase/types";
import Image from "next/image";

export default function MyProfilePage() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profileData = await getProfile(user.uid);
      setProfile(profileData);
    } catch (error) {
      console.error("프로필 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-green text-foreground flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-deep-green text-foreground flex items-center justify-center">
        <p>프로필을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-green text-foreground py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">내 프로필</h1>

        <div className="bg-primary/20 rounded-lg p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {profile.photos.map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <Image
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-1">이름</p>
              <p>{profile.displayName}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">직업</p>
              <p>{profile.job}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">소개</p>
              <p>{profile.intro}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">사랑의 언어</p>
              <p>{profile.loveLanguage.join(", ")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

