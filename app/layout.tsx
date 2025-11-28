import type { Metadata } from "next";
import "./globals.css";
import dynamicImport from "next/dynamic";

// Navigation을 클라이언트에서만 동적으로 로드
const Navigation = dynamicImport(() => import("@/components/Navigation"), {
  ssr: false,
});

// Footer를 클라이언트에서만 동적으로 로드
const Footer = dynamicImport(() => import("@/components/Footer"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Rotape - 로테이션 소개팅",
  description: "로테이션 소개팅 서비스로 새로운 만남을 시작하세요",
  keywords: ["로테이션 소개팅", "소개팅", "만남", "데이팅", "Rotape"],
  authors: [{ name: "Rotape" }],
  creator: "Rotape",
  publisher: "Rotape",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rotape.com'),
  openGraph: {
    title: "Rotape - 로테이션 소개팅",
    description: "로테이션 소개팅 서비스로 새로운 만남을 시작하세요",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://rotape.com',
    siteName: "Rotape",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rotape - 로테이션 소개팅",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rotape - 로테이션 소개팅",
    description: "로테이션 소개팅 서비스로 새로운 만남을 시작하세요",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

