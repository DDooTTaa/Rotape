"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProfileViewPage() {
  const [qrScanned, setQrScanned] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const handleQRScan = () => {
    // 실제로는 QR 스캐너 라이브러리를 사용해야 함
    setQrScanned(true);
    // 스캔된 데이터로 프로필 조회
  };

  return (
    <div className="min-h-screen bg-deep-green text-foreground py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">프로필 조회</h1>

        {!qrScanned ? (
          <div className="text-center">
            <p className="mb-4">QR 코드를 스캔하여 상대방 프로필을 확인하세요.</p>
            <button
              onClick={handleQRScan}
              className="bg-primary text-deep-green px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              QR 스캔 시작
            </button>
          </div>
        ) : (
          <div className="bg-primary/20 rounded-lg p-6">
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
                <p className="text-xl font-semibold mb-2">{profile.displayName}</p>
                <p className="mb-2">직업: {profile.job}</p>
                <p className="mb-4">소개: {profile.intro}</p>
              </>
            ) : (
              <p>프로필을 찾을 수 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

