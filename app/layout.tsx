import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";

// Navigation을 클라이언트에서만 동적으로 로드
const Navigation = dynamic(() => import("@/components/Navigation"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Rotape - 로테이션 소개팅",
  description: "로테이션 방식의 소개팅 서비스",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}

