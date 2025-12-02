"use client";

import { useState } from "react";

interface CalendarPopupProps {
  value: string; // datetime-local 형식: "2024-03-15T14:30" (시간은 기본값 사용)
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CalendarPopup({ 
  value, 
  onChange, 
  placeholder = "날짜를 선택하세요", 
  className = "" 
}: CalendarPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 현재 값 파싱 (시간은 기본값 14:00 사용)
  const getDateParts = () => {
    if (value) {
      const date = new Date(value);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        hours: 14, // 기본 시간 14:00
        minutes: 0,
      };
    }
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      hours: 14, // 기본 시간 14:00
      minutes: 0,
    };
  };

  const initialParts = getDateParts();
  const [selectedYear, setSelectedYear] = useState(initialParts.year);
  const [selectedMonth, setSelectedMonth] = useState(initialParts.month);
  const [selectedDay, setSelectedDay] = useState(initialParts.day);
  // 시간은 항상 14:00 고정
  const selectedHours = 14;
  const selectedMinutes = 0;

  const handleOpen = (e?: React.MouseEvent) => {
    // form 제출 방지
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // 현재 값이 있으면 파싱, 없으면 현재 날짜
    const parts = getDateParts();
    setSelectedYear(parts.year);
    setSelectedMonth(parts.month);
    setSelectedDay(parts.day);
    setIsOpen(true);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 오늘보다 이전인지 확인
    if (isDateBeforeToday(selectedYear, selectedMonth, selectedDay)) {
      alert("오늘보다 이전 날짜는 선택할 수 없습니다.");
      return;
    }
    
    const date = new Date(
      selectedYear,
      selectedMonth,
      selectedDay,
      14, // 기본 시간 14:00
      0
    );
    
    // datetime-local 형식으로 변환: "YYYY-MM-DDTHH:mm"
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const dateTimeLocal = `${year}-${month}-${day}T14:00`;
    onChange(dateTimeLocal);
    setIsOpen(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  // 월의 일수 계산
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 월의 첫 번째 날의 요일 (0=일요일)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // 날짜 표시용 (시간 제외)
  const formatDisplayDate = () => {
    if (!value) return null;
    const date = new Date(value);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 오늘 날짜/시간
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const todayHours = today.getHours();
  const todayMinutes = today.getMinutes();

  // 연도 목록 (올해부터 +5년)
  const years = Array.from({ length: 6 }, (_, i) => todayYear + i);
  
  // 월 목록
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  // 특정 날짜가 오늘보다 이전인지 확인 (시간은 14:00 기준)
  const isDateBeforeToday = (year: number, month: number, day: number) => {
    const selectedDate = new Date(year, month, day, 14, 0);
    const todayDate = new Date(todayYear, todayMonth, todayDay, 14, 0);
    return selectedDate < todayDate;
  };
  
  // 특정 월이 선택 가능한지 확인 (올해인 경우 오늘 이전 월은 불가)
  const isMonthDisabled = (year: number, month: number) => {
    if (year === todayYear && month < todayMonth) {
      return true;
    }
    return false;
  };
  
  // 특정 일이 선택 가능한지 확인
  const isDayDisabled = (year: number, month: number, day: number) => {
    if (year === todayYear && month === todayMonth && day < todayDay) {
      return true;
    }
    if (year === todayYear && month < todayMonth) {
      return true;
    }
    return false;
  };
  

  // 일 목록 생성
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
        {value ? (
          <span>{formatDisplayDate()}</span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </div>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" 
          onClick={handleCancel}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-6 text-center text-gray-800">날짜 선택</h3>
            
            {/* 연도 선택 */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">연도</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {years.map((year) => (
                  <button
                    type="button"
                    key={year}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedYear(year);
                      // 선택한 연도/월에 맞게 일자 조정
                      const maxDay = getDaysInMonth(year, selectedMonth);
                      if (selectedDay > maxDay) {
                        setSelectedDay(maxDay);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                      selectedYear === year
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* 월 선택 */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">월</label>
              <div className="grid grid-cols-6 gap-2">
                {months.map((month) => {
                  const disabled = isMonthDisabled(selectedYear, month);
                  return (
                    <button
                      type="button"
                      key={month}
                      disabled={disabled}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (disabled) return;
                        setSelectedMonth(month);
                        // 선택한 연도/월에 맞게 일자 조정
                        const maxDay = getDaysInMonth(selectedYear, month);
                        if (selectedDay > maxDay) {
                          setSelectedDay(maxDay);
                        }
                        // 오늘보다 이전 날짜면 오늘 날짜로 조정
                        if (isDayDisabled(selectedYear, month, selectedDay)) {
                          if (selectedYear === todayYear && month === todayMonth) {
                            setSelectedDay(todayDay);
                          } else {
                            setSelectedDay(1);
                          }
                        }
                      }}
                      className={`py-2 rounded-lg font-semibold transition ${
                        disabled
                          ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                          : selectedMonth === month
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {month + 1}월
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 일 선택 */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">일</label>
              <div className="grid grid-cols-7 gap-2">
                {/* 요일 헤더 */}
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-500 py-1">
                    {day}
                  </div>
                ))}
                {/* 빈 칸 (월의 첫 번째 날 전) */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} className="py-2"></div>
                ))}
                {/* 일자 */}
                {days.map((day) => {
                  const disabled = isDayDisabled(selectedYear, selectedMonth, day);
                  return (
                    <button
                      type="button"
                      key={day}
                      disabled={disabled}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (disabled) return;
                        setSelectedDay(day);
                      }}
                      className={`py-2 rounded-lg font-semibold transition ${
                        disabled
                          ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                          : selectedDay === day
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 버튼 */}
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

