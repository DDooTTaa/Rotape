"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { createUser, getUser } from "@/lib/firebase/users";
import LoadingSpinner from "@/components/LoadingSpinner";

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 카카오톡 SDK 로드 및 초기화
        const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
        if (!kakaoAppKey) {
          throw new Error("카카오톡 앱 키가 설정되지 않았습니다.");
        }

        // SDK가 로드되지 않았다면 로드
        if (!window.Kakao) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.7/kakao.min.js";
            script.integrity = "sha384-tJkjbtDbvoxO+diRuDtwRO9JXR7pjWnfjfRn5ePUpl7e7RJCxKCwwnfqUAdXh53p";
            script.crossOrigin = "anonymous";
            script.async = true;
            script.onload = () => {
              if (window.Kakao && typeof window.Kakao.init === 'function') {
                window.Kakao.init(kakaoAppKey);
                resolve();
              } else {
                reject(new Error("카카오톡 SDK 초기화 실패"));
              }
            };
            script.onerror = () => reject(new Error("카카오톡 SDK 로드 실패"));
            document.head.appendChild(script);
          });
        } else if (!window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoAppKey);
        }

        // URL에서 인증 코드 확인
        const code = searchParams.get("code");
        if (!code) {
          throw new Error("인증 코드를 받을 수 없습니다.");
        }

        // 카카오톡 액세스 토큰 받기
        const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: kakaoAppKey,
            redirect_uri: `${window.location.origin}/api/auth/kakao/callback`,
            code: code,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error("카카오톡 토큰 받기 실패");
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 카카오톡 사용자 정보 가져오기
        const userInfoResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error("카카오톡 사용자 정보 가져오기 실패");
        }

        const userInfo = await userInfoResponse.json();
        const kakaoId = userInfo.id.toString();
        const nickname = userInfo.kakao_account?.profile?.nickname || userInfo.properties?.nickname || "";
        const email = userInfo.kakao_account?.email || `${kakaoId}@kakao.com`;

        // 서버에서 Custom Token 생성 요청
        const response = await fetch("/api/auth/kakao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kakaoId,
            nickname,
            email,
          }),
        });

        if (!response.ok) {
          throw new Error("Custom Token 생성 실패");
        }

        const { customToken } = await response.json();

        // Custom Token으로 Firebase 로그인
        if (!auth) {
          throw new Error("Firebase 인증 서비스를 사용할 수 없습니다.");
        }

        const userCredential = await signInWithCustomToken(auth, customToken);
        const user = userCredential.user;

        // 기존 사용자 확인
        const existingUser = await getUser(user.uid);

        if (existingUser) {
          // 기존 사용자
          if (existingUser.isAdmin) {
            router.push("/admin");
          } else {
            router.push("/participant/events");
          }
        } else {
          // 신규 사용자 - 사용자 문서 생성
          const userData = {
            name: nickname || "카카오톡 사용자",
            gender: "M" as const,
            birthday: "",
            age: 0,
            createdAt: new Date(),
            isAdmin: false,
          };

          try {
            await createUser(user.uid, userData);
          } catch (error) {
            console.log("사용자 생성 실패:", error);
          }

          // 신규 사용자는 행사 리스트로 이동
          router.push("/participant/events");
        }

        setStatus("success");
      } catch (error: any) {
        console.error("카카오톡 로그인 처리 실패:", error);
        setErrorMessage(error.message || "카카오톡 로그인에 실패했습니다.");
        setStatus("error");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">카카오톡 로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}

