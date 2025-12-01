"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUser } from "@/lib/firebase/users";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import InfoModal from "@/components/InfoModal";

export const dynamic = 'force-dynamic';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const participantNavItems: NavItem[] = [
  {
    href: "/participant/events",
    label: "행사",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/participant/my-events",
    label: "내 모임",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/participant/profile/my",
    label: "마이페이지",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "행사관리",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/admin/matching",
    label: "매칭",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/rotation",
    label: "로테이션",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // 클라이언트에서만 마운트되도록 처리
  useEffect(() => {
    setMounted(true);
    
    // 서버 사이드 렌더링 방지
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // auth가 없으면 early return
    if (!auth) {
      setLoading(false);
      return;
    }

    // auth 상태 변경 감지
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Auth state 변경 감지 실패:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 서버 사이드 렌더링 방지
    if (!mounted || typeof window === 'undefined' || !auth) {
      setLoading(false);
      return;
    }

    const checkUserRole = async () => {
      if (user) {
        try {
          const userData = await getUser(user.uid);
          if (userData) {
            setIsAdmin(userData.isAdmin || false);
          }
        } catch (error) {
          console.error("사용자 정보 로드 실패:", error);
        }
      }
      setLoading(false);
    };

    checkUserRole();
  }, [user, mounted]);

  // 서버 사이드 렌더링 방지 또는 auth가 없을 때
  if (!mounted || typeof window === 'undefined' || !auth) {
    return null;
  }

  // 로그인 페이지나 메인 페이지에서는 네비게이션 숨김
  if (pathname === "/" || pathname === "/participant/auth" || loading || !user) {
    return null;
  }

  // 일반 사용자가 운영자 페이지에 접근할 때 네비게이션 숨김
  if (pathname.startsWith("/admin") && !isAdmin && !loading) {
    return null;
  }

  const navItems = isAdmin ? adminNavItems : participantNavItems;
  const isActive = (href: string) => {
    // 정확히 일치하는 경우
    if (pathname === href) return true;
    // 하위 경로인 경우 (예: /admin/event/123)
    if (pathname.startsWith(href + "/")) {
      // 대시보드(/admin)는 정확히 일치할 때만 활성화
      if (href === "/admin") return false;
      // 다른 메뉴는 하위 경로도 활성화
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth!);
      router.push("/");
      // 리다이렉트 후에도 잠시 로딩 유지
      setTimeout(() => setIsLoggingOut(false), 500);
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다.");
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {isLoggingOut && <LoadingSpinner message="로그아웃 중..." />}
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      {/* 데스크톱 네비게이션 (상단) */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 bg-white border-b-2 border-primary z-50 shadow-md">
        <div className="max-w-7xl mx-auto w-full px-4">
          <div className="flex items-center justify-between h-16">
            <Link href={isAdmin ? "/admin" : "/participant/events"} className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">Rotape</span>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                    isActive(item.href)
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden">{item.icon}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden lg:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 데스크톱 플로팅 인포 버튼 */}
      <button
        onClick={() => setShowInfoModal(true)}
        className="hidden md:flex fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white text-primary font-bold border-2 border-primary/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 items-center justify-center z-40"
        aria-label="Rotape 소개 보기"
      >
        ?
      </button>

      {/* 모바일 TopBar (상단) */}
      <nav className="md:hidden fixed top-0 left-0 right-0 bg-white border-b-2 border-primary z-50 shadow-md">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href={isAdmin ? "/admin" : "/participant/events"} className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">Rotape</span>
          </Link>
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-10 h-10 rounded-full border-2 border-primary/30 text-primary font-bold bg-white hover:bg-primary/5 transition-all duration-300 flex items-center justify-center"
            aria-label="Rotape 소개 보기"
          >
            ?
          </button>
        </div>
      </nav>

      {/* 모바일 네비게이션 (하단) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary z-50 shadow-lg">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-gray-600"
              }`}
            >
              <span className={`${isActive(item.href) ? "text-primary" : "text-gray-600"}`}>
                {item.icon}
              </span>
              <span className="text-xs mt-1 font-semibold">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs mt-1 font-semibold">로그아웃</span>
          </button>
        </div>
      </nav>

      {/* 데스크톱 네비게이션 공간 확보 */}
      <div className="hidden md:block h-16"></div>

      {/* 모바일 TopBar 공간 확보 */}
      <div className="md:hidden h-14"></div>
    </>
  );
}

