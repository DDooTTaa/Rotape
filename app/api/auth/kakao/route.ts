import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Firebase Admin 초기화
if (!getApps().length) {
  try {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      initializeApp({
        credential: cert(serviceAccount as any),
      });
    }
  } catch (error) {
    console.error("Firebase Admin 초기화 실패:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { kakaoId, nickname, email } = await request.json();

    if (!kakaoId) {
      return NextResponse.json({ error: "카카오톡 ID가 필요합니다." }, { status: 400 });
    }

    // Firebase Admin Auth 가져오기
    const auth = getAuth();
    
    // 카카오톡 ID를 기반으로 사용자 ID 생성
    const uid = `kakao_${kakaoId}`;
    
    try {
      // 기존 사용자 확인
      let user;
      try {
        user = await auth.getUser(uid);
      } catch (error: any) {
        // 사용자가 없으면 생성
        if (error.code === "auth/user-not-found") {
          user = await auth.createUser({
            uid,
            displayName: nickname || "카카오톡 사용자",
            email: email || `${kakaoId}@kakao.com`,
          });
        } else {
          throw error;
        }
      }

      // Custom Token 생성
      const customToken = await auth.createCustomToken(uid, {
        provider: "kakao",
        kakaoId: kakaoId,
      });

      return NextResponse.json({ customToken });
    } catch (error: any) {
      console.error("Firebase 사용자 생성/조회 실패:", error);
      return NextResponse.json(
        { error: "사용자 인증에 실패했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("카카오톡 로그인 처리 실패:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

