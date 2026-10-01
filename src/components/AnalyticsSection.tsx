import React from 'react';
import type { DailyBoxOfficeItem } from '../types/kobis';
import { formatKoreanCurrencyCompact, formatNumber } from '../utils/dateUtils';

interface AnalyticsSectionProps {
  items: DailyBoxOfficeItem[];
  selectedMovieCd: string | null;
  onSelectMovie: (item: DailyBoxOfficeItem) => void;
  selectedDateFormatted: string;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  items,
  selectedMovieCd,
  onSelectMovie,
  selectedDateFormatted,
}) => {
  if (items.length === 0) {
    return null;
  }

  const maxAudiCnt = Math.max(...items.map((i) => Number(i.audiCnt) || 0), 1);
  const maxSalesShare = Math.max(...items.map((i) => Number(i.salesShare) || 0), 1);

  const top3ShareSum = items
    .slice(0, 3)
    .reduce((acc, cur) => acc + (Number(cur.salesShare) || 0), 0)
    .toFixed(1);

  return (
    <section
      id="analytics-section"
      aria-label="점유율 및 상영 효율 분석"
      className="max-w-[1360px] mx-auto px-6 py-10 border-t border-slate-200 space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            일일 박스오피스 정량 지표 비교 · {selectedDateFormatted}
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 tracking-tight font-display">
            02. 매출 점유율 및 상영 효율 분석
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-mono tabular-nums">
          상위 3개 작품 합산 매출점유율: <strong className="text-slate-900">{top3ShareSum}%</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Sales Share Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              작품별 매출액 점유율 (salesShare)
            </h3>
            <span className="text-xs text-slate-500">클릭하여 상세정보 연동</span>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const share = Number(item.salesShare) || 0;
              const widthPct = Math.max((share / maxSalesShare) * 100, 2);
              const isSelected = item.movieCd === selectedMovieCd;

              return (
                <button
                  key={item.movieCd}
                  type="button"
                  onClick={() => onSelectMovie(item)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected ? 'bg-red-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono tabular-nums font-bold text-slate-900 w-5">
                        {item.rank}.
                      </span>
                      <span className="font-medium text-slate-900 truncate">{item.movieNm}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <span className="text-slate-500">
                        {formatKoreanCurrencyCompact(item.salesAmt)}
                      </span>
                      <span className="font-semibold text-slate-900 w-12 text-right">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className={`h-full transition-transform duration-150 origin-left ${
                        isSelected
                          ? 'bg-red-600'
                          : Number(item.rank) <= 3
                          ? 'bg-slate-900'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Screen & Show Efficiency Breakdown */}
        <div
          id="efficiency-section"
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              일일 관객수 및 상영회차당 관객 효율
            </h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              audiCnt / showCnt
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const audi = Number(item.audiCnt) || 0;
              const shows = Number(item.showCnt) || 1;
              const scrns = Number(item.scrnCnt) || 1;
              const perShow = (audi / shows).toFixed(1);
              const widthPct = Math.max((audi / maxAudiCnt) * 100, 2);
              const isSelected = item.movieCd === selectedMovieCd;

              return (
                <button
                  key={item.movieCd}
                  type="button"
                  onClick={() => onSelectMovie(item)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected ? 'bg-red-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono tabular-nums font-bold text-slate-900 w-5">
                        {item.rank}.
                      </span>
                      <span className="font-medium text-slate-900 truncate">{item.movieNm}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums text-xs">
                      <span className="text-slate-500">
                        {formatNumber(scrns)}관 · 회당 {perShow}명
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-semibold text-slate-900 w-20 text-right">
                        {formatNumber(audi)}명
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className={`h-full transition-transform duration-150 origin-left ${
                        isSelected
                          ? 'bg-red-600'
                          : Number(item.rank) <= 3
                          ? 'bg-slate-800'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
