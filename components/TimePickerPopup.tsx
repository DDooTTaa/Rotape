"use client";

import { useState } from "react";

interface TimePickerPopupProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TimePickerPopup({ value, onChange, placeholder, className }: TimePickerPopupProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(value ? parseInt(value.split(':')[0]) || 16 : 16);
  const [selectedMinute, setSelectedMinute] = useState(value ? parseInt(value.split(':')[1]) || 0 : 0);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    const time = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onChange(time);
    setShowTimePicker(false);
  };

  return (
    <>
      <div className="relative">
        <input
          type="text"
          readOnly
          value={value}
          placeholder={placeholder}
          onClick={() => setShowTimePicker(true)}
          className={className || "input-elegant cursor-pointer"}
        />
      </div>

      {showTimePicker && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTimePicker(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">시간 선택</h3>
              <button
                type="button"
                onClick={() => setShowTimePicker(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex flex-col items-center">
                <label className="text-sm font-semibold text-gray-600 mb-2">시</label>
                <div className="border-2 border-primary rounded-lg overflow-hidden">
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    className="px-4 py-2 text-lg font-semibold focus:outline-none"
                  >
                    {hours.map((hour) => (
                      <option key={hour} value={hour}>
                        {String(hour).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <span className="text-2xl font-bold mt-6">:</span>

              <div className="flex flex-col items-center">
                <label className="text-sm font-semibold text-gray-600 mb-2">분</label>
                <div className="border-2 border-primary rounded-lg overflow-hidden">
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                    className="px-4 py-2 text-lg font-semibold focus:outline-none"
                  >
                    {minutes.map((minute) => (
                      <option key={minute} value={minute}>
                        {String(minute).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowTimePicker(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
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
