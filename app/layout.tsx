import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rotape - 로테이션 소개팅",
  description: "로테이션 방식의 소개팅 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

