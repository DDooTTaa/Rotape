"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/config";
import Image from "next/image";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function ProfileViewPage() {
  const router = useRouter();
  const [qrScanned, setQrScanned] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const handleQRScan = () => {
    // 실제로는 QR 스캐너 라이브러리를 사용해야 함
    setQrScanned(true);
    // 스캔된 데이터로 프로필 조회
  };


  return (
    <div className="min-h-screen bg-white text-gray-800 pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">프로필 조회</h1>
        </div>

        {!qrScanned ? (
          <div className="text-center">
            <p className="mb-4 text-gray-700">QR 코드를 스캔하여 상대방 프로필을 확인하세요.</p>
            <button
              onClick={handleQRScan}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              QR 스캔 시작
            </button>
          </div>
        ) : (
          <div className="bg-gray-100 border-2 border-primary rounded-lg p-6">
            {profile ? (
              <>
                {profile.photos?.[0] && (
                  <div className="mb-4">
                    <Image
                      src={profile.photos[0]}
                      alt="Profile"
                      width={200}
                      height={200}
                      className="rounded-lg mx-auto"
                    />
                  </div>
                )}
                <p className="text-xl font-semibold mb-2 text-gray-800">{profile.displayName}</p>
                <p className="mb-2 text-gray-800">직업: {profile.job}</p>
                <p className="mb-4 text-gray-800">소개: {profile.intro}</p>
              </>
            ) : (
              <p className="text-gray-700">프로필을 찾을 수 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

