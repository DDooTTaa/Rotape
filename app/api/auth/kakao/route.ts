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

    console.log("Firebase Admin 초기화 시도:", {
      hasProjectId: !!serviceAccount.projectId,
      hasPrivateKey: !!serviceAccount.privateKey,
      hasClientEmail: !!serviceAccount.clientEmail,
    });

    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      initializeApp({
        credential: cert(serviceAccount as any),
      });
      console.log("Firebase Admin 초기화 성공");
    } else {
      console.error("Firebase Admin 환경 변수 누락:", {
        projectId: serviceAccount.projectId ? "✅" : "❌",
        privateKey: serviceAccount.privateKey ? "✅" : "❌",
        clientEmail: serviceAccount.clientEmail ? "✅" : "❌",
      });
    }
  } catch (error) {
    console.error("Firebase Admin 초기화 실패:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { kakaoId, nickname, email } = await request.json();

    console.log("카카오톡 로그인 요청 받음:", { kakaoId, nickname, email });

    if (!kakaoId) {
      console.error("카카오톡 ID 누락");
      return NextResponse.json({ error: "카카오톡 ID가 필요합니다." }, { status: 400 });
    }

    // Firebase Admin 초기화 확인
    if (getApps().length === 0) {
      console.error("Firebase Admin이 초기화되지 않았습니다.");
      return NextResponse.json(
        { error: "서버 설정 오류: Firebase Admin이 초기화되지 않았습니다." },
        { status: 500 }
      );
    }

    // Firebase Admin Auth 가져오기
    let auth;
    try {
      auth = getAuth();
    } catch (error: any) {
      console.error("Firebase Admin Auth 가져오기 실패:", error);
      return NextResponse.json(
        { error: "서버 설정 오류: Firebase Admin Auth를 가져올 수 없습니다." },
        { status: 500 }
      );
    }
    
    // 카카오톡 ID를 기반으로 사용자 ID 생성
    const uid = `kakao_${kakaoId}`;
    console.log("사용자 UID:", uid);
    
    try {
      // 기존 사용자 확인
      let user;
      try {
        user = await auth.getUser(uid);
        console.log("기존 사용자 발견:", user.uid);
      } catch (error: any) {
        // 사용자가 없으면 생성
        if (error.code === "auth/user-not-found") {
          console.log("신규 사용자 생성 시도:", uid);
          user = await auth.createUser({
            uid,
            displayName: nickname || "카카오톡 사용자",
            email: email || `${kakaoId}@kakao.com`,
          });
          console.log("신규 사용자 생성 완료:", user.uid);
        } else {
          console.error("사용자 조회 실패:", error);
          throw error;
        }
      }

      // Custom Token 생성
      console.log("Custom Token 생성 시도:", uid);
      const customToken = await auth.createCustomToken(uid, {
        provider: "kakao",
        kakaoId: kakaoId,
      });
      console.log("Custom Token 생성 완료");

      return NextResponse.json({ customToken });
    } catch (error: any) {
      console.error("Firebase 사용자 생성/조회 실패:", error);
      console.error("에러 상세:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        { 
          error: "사용자 인증에 실패했습니다.",
          details: error.message || "알 수 없는 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("카카오톡 로그인 처리 실패:", error);
    console.error("에러 상세:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: "서버 오류가 발생했습니다.",
        details: error.message || "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

