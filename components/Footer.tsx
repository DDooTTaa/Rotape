"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import TermsModal from "@/components/TermsModal";

export default function Footer() {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 모바일에서는 마이 페이지에서만 표시
  const shouldShow = !isMobile || pathname === "/participant/profile/my";

  if (!shouldShow) return null;

  return (
    <>
      <footer className={`mt-auto py-4 md:py-2 ${isMobile && pathname === "/participant/profile/my" ? "mb-16 bg-white border-t-2 border-primary/20" : ""}`}>
        <div className="max-w-7xl mx-auto px-4">
          {isMobile && pathname === "/participant/profile/my" ? (
            <div className="flex flex-col gap-4 text-sm text-gray-600">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="hover:text-primary transition-colors font-medium"
                >
                  서비스 이용약관
                </button>
                <span>|</span>
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="hover:text-primary transition-colors font-medium"
                >
                  개인정보 처리방침
                </button>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-gray-600 font-medium">
                  Contact: <a href="tel:010-8981-1131" className="text-primary hover:underline">010-8981-1131</a>
                </p>
                <p className="text-gray-500">
                  © {new Date().getFullYear()} Rotape. All rights reserved.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
              <button
                onClick={() => setShowTermsModal(true)}
                className="hover:text-primary transition-colors"
              >
                서비스 이용약관
              </button>
              <span>|</span>
              <button
                onClick={() => setShowTermsModal(true)}
                className="hover:text-primary transition-colors"
              >
                개인정보 처리방침
              </button>
              <span>|</span>
              <span>
                Contact: <a href="tel:010-8981-1131" className="text-primary hover:underline">010-8981-1131</a>
              </span>
              <span>|</span>
              <span>© {new Date().getFullYear()} Rotape. All rights reserved.</span>
            </div>
          )}
        </div>
      </footer>
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
}

