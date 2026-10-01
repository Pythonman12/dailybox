import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { MultiMovieFilter, RepNationFilter } from '../types/kobis';
import {
  clampToBeforeToday,
  formatDateToInput,
  formatKoreanDateFull,
  getYesterdayDateString,
  shiftDateString,
  toTargetDt,
} from '../utils/dateUtils';

interface DateNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (newDate: string) => void;
  repNationCd: RepNationFilter;
  onChangeRepNation: (val: RepNationFilter) => void;
  multiMovieYn: MultiMovieFilter;
  onChangeMultiMovie: (val: MultiMovieFilter) => void;
  isLoading: boolean;
}

const WEEKDAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onSelectDate,
  repNationCd,
  onChangeRepNation,
  multiMovieYn,
  onChangeMultiMovie,
  isLoading,
}) => {
  const maxDate = getYesterdayDateString();
  const isAtMaxDate = selectedDate >= maxDate;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => Number(selectedDate.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState<number>(() => Number(selectedDate.slice(5, 7)) - 1);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const handlePrevDay = () => {
    onSelectDate(shiftDateString(selectedDate, -1));
  };

  const handleNextDay = () => {
    if (isAtMaxDate) return;
    onSelectDate(shiftDateString(selectedDate, 1));
  };

  const handleQuickJump = (daysAgoFromYesterday: number) => {
    onSelectDate(shiftDateString(maxDate, -daysAgoFromYesterday));
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const maxY = Number(maxDate.slice(0, 4));
    const maxM = Number(maxDate.slice(5, 7)) - 1;
    if (viewYear > maxY || (viewYear === maxY && viewMonth >= maxM)) {
      return;
    }
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate calendar grid days for viewYear / viewMonth
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells: Array<{ day: number | null; dateStr: string; disabled: boolean }> = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ day: null, dateStr: '', disabled: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateToInput(new Date(viewYear, viewMonth, d));
    const disabled = dateStr > maxDate || dateStr < '2004-01-01';
    calendarCells.push({ day: d, dateStr, disabled });
  }

  const maxYearNum = Number(maxDate.slice(0, 4));
  const maxMonthNum = Number(maxDate.slice(5, 7)) - 1;
  const isAtMaxCalendarMonth =
    viewYear > maxYearNum || (viewYear === maxYearNum && viewMonth >= maxMonthNum);

  return (
    <section
      aria-label="박스오피스 조회 조건 및 날짜 선택"
      className="bg-white border-b border-slate-200"
    >
      <div className="max-w-[1360px] mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          {/* Left: Selected Date Headline & Date Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>영화진흥위원회 통합전산망 공식 집계</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">targetDt={toTargetDt(selectedDate)}</span>
              <span aria-hidden="true">·</span>
              <span>오늘 이전 날짜 조회 가능 (최신 집계일: {maxDate})</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
                {formatKoreanDateFull(selectedDate)}
              </h1>

              {/* Day Step & Date Picker Controls */}
              <div className="flex items-center gap-1.5" ref={popoverRef}>
                <button
                  type="button"
                  onClick={handlePrevDay}
                  disabled={isLoading}
                  title="이전 날짜 (-1일)"
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>이전일</span>
                </button>

                {/* Native date input + Custom Calendar Trigger */}
                <div className="relative flex items-center">
                  <input
                    type="date"
                    aria-label="조회 기준일 선택 (오늘 이전 날짜)"
                    value={selectedDate}
                    min="2004-01-01"
                    max={maxDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        onSelectDate(clampToBeforeToday(e.target.value));
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-mono tabular-nums font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen((prev) => !prev)}
                    className="ml-1.5 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>달력 선택</span>
                  </button>

                  {/* Custom Calendar Popover */}
                  {isCalendarOpen && (
                    <div className="absolute left-0 top-full mt-2 z-40 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="이전 달"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5 font-mono tabular-nums text-sm font-semibold text-slate-900">
                          <select
                            aria-label="연도 선택"
                            value={viewYear}
                            onChange={(e) => {
                              const newY = Number(e.target.value);
                              setViewYear(newY);
                              if (newY === maxYearNum && viewMonth > maxMonthNum) {
                                setViewMonth(maxMonthNum);
                              }
                            }}
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono cursor-pointer"
                          >
                            {Array.from(
                              { length: maxYearNum - 2004 + 1 },
                              (_, idx) => maxYearNum - idx
                            ).map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}년
                              </option>
                            ))}
                          </select>
                          <select
                            aria-label="월 선택"
                            value={viewMonth}
                            onChange={(e) => setViewMonth(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono cursor-pointer"
                          >
                            {Array.from({ length: 12 }, (_, mIdx) => mIdx).map((mIdx) => {
                              const disabledMonth =
                                viewYear === maxYearNum && mIdx > maxMonthNum;
                              return (
                                <option key={mIdx} value={mIdx} disabled={disabledMonth}>
                                  {String(mIdx + 1).padStart(2, '0')}월
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          disabled={isAtMaxCalendarMonth}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="다음 달"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {WEEKDAY_HEADERS.map((w, idx) => (
                          <div
                            key={w}
                            className={`text-[11px] font-medium py-1 ${
                              idx === 0
                                ? 'text-red-600'
                                : idx === 6
                                ? 'text-blue-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {w}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {calendarCells.map((cell, idx) => {
                          if (!cell.day) {
                            return <div key={`empty-${idx}`} className="h-8" />;
                          }
                          const isSelected = cell.dateStr === selectedDate;
                          const isYesterday = cell.dateStr === maxDate;
                          return (
                            <button
                              key={cell.dateStr}
                              type="button"
                              disabled={cell.disabled}
                              onClick={() => {
                                onSelectDate(cell.dateStr);
                                setIsCalendarOpen(false);
                              }}
                              className={`h-8 rounded-md text-xs font-mono tabular-nums transition-colors flex items-center justify-center ${
                                cell.disabled
                                  ? 'text-slate-300 line-through cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-red-600 text-white font-semibold'
                                  : isYesterday
                                  ? 'bg-slate-900 text-white font-medium hover:bg-slate-800 cursor-pointer'
                                  : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                              }`}
                            >
                              {cell.day}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>오늘 이전 날짜만 선택 가능</span>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectDate(maxDate);
                            setIsCalendarOpen(false);
                          }}
                          className="font-medium text-red-600 hover:underline cursor-pointer"
                        >
                          어제({maxDate})로 이동
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextDay}
                  disabled={isAtMaxDate || isLoading}
                  title={
                    isAtMaxDate
                      ? '오늘 이전 날짜(어제)까지만 선택할 수 있습니다'
                      : '다음 날짜 (+1일)'
                  }
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>다음일</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-slate-500 mr-1">빠른 날짜 이동:</span>
              {[
                { label: '어제 (최신)', days: 0 },
                { label: '3일 전', days: 2 },
                { label: '1주일 전', days: 6 },
                { label: '1개월 전', days: 30 },
                { label: '1년 전', days: 365 },
              ].map((preset) => {
                const target = shiftDateString(maxDate, -preset.days);
                const active = selectedDate === target;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleQuickJump(preset.days)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              {selectedDate !== maxDate && (
                <button
                  type="button"
                  onClick={() => onSelectDate(maxDate)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>최신 집계일 복귀</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Official KOBIS API Parameter Filter Tabs */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-500">국적별 구분</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { value: 'ALL', label: '전체' },
                    { value: 'K', label: '한국영화' },
                    { value: 'F', label: '외국영화' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => onChangeRepNation(tab.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      repNationCd === tab.value
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-500">상영 유형 구분</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { value: 'ALL', label: '전체' },
                    { value: 'N', label: '상업영화' },
                    { value: 'Y', label: '다양성영화' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => onChangeMultiMovie(tab.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      multiMovieYn === tab.value
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
