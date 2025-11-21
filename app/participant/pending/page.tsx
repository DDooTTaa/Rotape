"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="absolute top-4 right-4">
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            로그아웃
          </button>
        </div>
        <div className="mb-8">
          <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-3xl font-bold mb-4">심사 중</h1>
          <p className="text-gray-700">
            지원서가 심사 중입니다. 승인되면 알림을 드리겠습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

