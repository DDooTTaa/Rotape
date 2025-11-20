"use client";

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-deep-green text-foreground flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-3xl font-bold mb-4">심사 중</h1>
          <p className="text-gray-300">
            지원서가 심사 중입니다. 승인되면 알림을 드리겠습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

