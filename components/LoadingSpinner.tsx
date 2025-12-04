"use client";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "처리 중..." }: LoadingSpinnerProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[200px]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-700 font-semibold text-center">{message}</p>
      </div>
    </div>
  );
}








