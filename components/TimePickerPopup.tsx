"use client";

import { useState } from "react";

interface TimePickerPopupProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TimePickerPopup({ value, onChange, placeholder = "예: 16:00", className = "" }: TimePickerPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(() => {
    if (value && value.includes(":")) {
      return parseInt(value.split(":")[0]) || 0;
    }
    return 0;
  });
  const [minutes, setMinutes] = useState(() => {
    if (value && value.includes(":")) {
      return parseInt(value.split(":")[1]) || 0;
    }
    return 0;
  });

  const handleOpen = (e?: React.MouseEvent) => {
    // form 제출 방지
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // 현재 값이 있으면 파싱, 없으면 기본값
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      setHours(parseInt(h) || 0);
      setMinutes(parseInt(m) || 0);
    }
    setIsOpen(true);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleOpen(e);
        }}
        onKeyDown={(e) => {
          // Enter 또는 Space 키로 팝업 열기
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleOpen();
          }
        }}
        className={`cursor-pointer ${className} ${!value ? 'text-gray-400' : ''} min-h-[42px] flex items-center`}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {value || <span className="text-gray-400">{placeholder}</span>}
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={handleCancel}>
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-6 text-center text-gray-800">시간 선택</h3>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* 시간 선택 */}
              <div className="flex flex-col items-center">
                <label className="text-sm font-semibold text-gray-600 mb-2">시</label>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <button
                      type="button"
                      key={h}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setHours(h);
                      }}
                      className={`w-12 py-2 rounded-lg font-semibold transition ${
                        hours === h
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-2xl font-bold text-gray-400 mt-8">:</span>

              {/* 분 선택 */}
              <div className="flex flex-col items-center">
                <label className="text-sm font-semibold text-gray-600 mb-2">분</label>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {[0, 15, 30, 45].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMinutes(m);
                      }}
                      className={`w-12 py-2 rounded-lg font-semibold transition ${
                        minutes === m
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-primary to-[#0d4a1a] text-white hover:opacity-90 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


