import React, { useState } from 'react';
import type { DailyBoxOfficeItem, MovieInfo } from '../types/kobis';
import {
  formatKoreanCurrencyCompact,
  formatNumber,
  formatOpenDate,
} from '../utils/dateUtils';

interface MovieDetailPanelProps {
  selectedBoxOffice: DailyBoxOfficeItem | null;
  movieInfo: MovieInfo | null;
  isLoadingInfo: boolean;
  infoError: string | null;
  onRetryInfo: () => void;
  selectedDateFormatted: string;
}

export const MovieDetailPanel: React.FC<MovieDetailPanelProps> = ({
  selectedBoxOffice,
  movieInfo,
  isLoadingInfo,
  infoError,
  onRetryInfo,
  selectedDateFormatted,
}) => {
  const [showAllActors, setShowAllActors] = useState(false);

  if (!selectedBoxOffice) {
    return (
      <aside
        aria-label="영화 상세정보"
        className="bg-white border border-slate-200 rounded-xl p-6 text-center"
      >
        <p className="text-sm font-medium text-slate-700">선택된 영화가 없습니다</p>
        <p className="mt-1 text-xs text-slate-500">
          좌측 일일 박스오피스 목록에서 영화를 클릭하면 영화진흥위원회(KOBIS) 영화 상세정보가 표시됩니다.
        </p>
      </aside>
    );
  }

  const rankIntenNum = Number(selectedBoxOffice.rankInten || 0);
  const audiPerShow =
    Number(selectedBoxOffice.showCnt) > 0
      ? (Number(selectedBoxOffice.audiCnt) / Number(selectedBoxOffice.showCnt)).toFixed(1)
      : '0.0';
  const showPerScrn =
    Number(selectedBoxOffice.scrnCnt) > 0
      ? (Number(selectedBoxOffice.showCnt) / Number(selectedBoxOffice.scrnCnt)).toFixed(1)
      : '0.0';

  const nationsText =
    movieInfo?.nations && movieInfo.nations.length > 0
      ? movieInfo.nations.map((n) => n.nationNm).join(', ')
      : '국가 미상';
  const genresText =
    movieInfo?.genres && movieInfo.genres.length > 0
      ? movieInfo.genres.map((g) => g.genreNm).join(' / ')
      : '장르 미상';
  const watchGradeText =
    movieInfo?.audits && movieInfo.audits.length > 0
      ? movieInfo.audits.map((a) => a.watchGradeNm).join(', ')
      : '등급 미정';
  const auditNoText =
    movieInfo?.audits && movieInfo.audits.length > 0 && movieInfo.audits[0].auditNo
      ? movieInfo.audits[0].auditNo
      : '-';

  const actorsList = movieInfo?.actors || [];
  const visibleActors = showAllActors ? actorsList : actorsList.slice(0, 8);

  return (
    <aside
      id="movie-detail-section"
      aria-label="선택된 영화 상세정보"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
    >
      {/* Top Kicker & Title Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-red-600 font-mono tabular-nums">
              박스오피스 #{selectedBoxOffice.rank}위
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {selectedBoxOffice.rankOldAndNew === 'NEW'
                ? '신규 진입 (NEW)'
                : rankIntenNum > 0
                ? `전일 대비 ▲${rankIntenNum}`
                : rankIntenNum < 0
                ? `전일 대비 ▼${Math.abs(rankIntenNum)}`
                : '전일 순위 유지 (-)'}
            </span>
          </div>
          <span className="font-mono tabular-nums text-slate-400">
            코드 {selectedBoxOffice.movieCd}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {movieInfo?.movieNm || selectedBoxOffice.movieNm}
        </h2>

        {(movieInfo?.movieNmEn || movieInfo?.movieNmOg) && (
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {movieInfo.movieNmEn}
            {movieInfo.movieNmEn && movieInfo.movieNmOg && movieInfo.movieNmEn !== movieInfo.movieNmOg
              ? ` · ${movieInfo.movieNmOg}`
              : !movieInfo.movieNmEn && movieInfo.movieNmOg
              ? movieInfo.movieNmOg
              : ''}
          </p>
        )}

        {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
        {movieInfo && !isLoadingInfo && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
            <span>{genresText}</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>{nationsText}</span>
            {movieInfo.showTm && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="font-mono tabular-nums">{movieInfo.showTm}분</span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>{watchGradeText}</span>
            {movieInfo.typeNm && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span>
                  {movieInfo.typeNm} ({movieInfo.prdtStatNm || '개봉'})
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Selected Date Box Office Performance Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-900">
            일일 박스오피스 실적 ({selectedDateFormatted})
          </h3>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            매출점유율 {selectedBoxOffice.salesShare}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50/70 p-3.5">
            <span className="block text-xs text-slate-500">일일 관객수 (전일 대비)</span>
            <p className="mt-1 text-base font-bold text-slate-900 font-mono tabular-nums">
              {formatNumber(selectedBoxOffice.audiCnt)}명
            </p>
            <span className="mt-0.5 block text-[11px] text-slate-500 font-mono tabular-nums">
              증감 {Number(selectedBoxOffice.audiInten) >= 0 ? '+' : ''}
              {formatNumber(selectedBoxOffice.audiInten)}명 ({selectedBoxOffice.audiChange}%)
            </span>
          </div>

          <div className="bg-slate-50/70 p-3.5">
            <span className="block text-xs text-slate-500">누적 관객수</span>
            <p className="mt-1 text-base font-bold text-slate-900 font-mono tabular-nums">
              {formatNumber(selectedBoxOffice.audiAcc)}명
            </p>
            <span className="mt-0.5 block text-[11px] text-slate-500 font-mono tabular-nums">
              개봉일 {formatOpenDate(selectedBoxOffice.openDt)}
            </span>
          </div>

          <div className="bg-slate-50/70 p-3.5">
            <span className="block text-xs text-slate-500">일일 매출액</span>
            <p className="mt-1 text-sm font-bold text-slate-900 font-mono tabular-nums">
              {formatKoreanCurrencyCompact(selectedBoxOffice.salesAmt)}
            </p>
            <span className="mt-0.5 block text-[11px] text-slate-500 font-mono tabular-nums">
              {formatNumber(selectedBoxOffice.salesAmt)}원
            </span>
          </div>

          <div className="bg-slate-50/70 p-3.5">
            <span className="block text-xs text-slate-500">누적 매출액</span>
            <p className="mt-1 text-sm font-bold text-slate-900 font-mono tabular-nums">
              {formatKoreanCurrencyCompact(selectedBoxOffice.salesAcc)}
            </p>
            <span className="mt-0.5 block text-[11px] text-slate-500 font-mono tabular-nums">
              {formatNumber(selectedBoxOffice.salesAcc)}원
            </span>
          </div>

          <div className="bg-slate-50/70 p-3.5">
            <span className="block text-xs text-slate-500">상영 스크린 · 상영횟수</span>
            <p className="mt-1 text-sm font-bold text-slate-900 font-mono tabular-nums">
              {formatNumber(selectedBoxOffice.scrnCnt)}개관 · {formatNumber(selectedBoxOffice.showCnt)}회
            </p>
            <span className="mt-0.5 block text-[11px] text-slate-500 font-mono tabular-nums">
              스크린당 일평균 {showPerScrn}회 상영
            </span>
          </div>

          <div className="bg-slate-50/70 p-3.5">
            <span className="block text-xs text-slate-500">회차당 평균 관객수</span>
            <p className="mt-1 text-sm font-bold text-slate-900 font-mono tabular-nums">
              {audiPerShow}명 / 회
            </p>
            <span className="mt-0.5 block text-[11px] text-slate-500 font-mono tabular-nums">
              전일 매출 대비 {selectedBoxOffice.salesChange}%
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Movie Information from searchMovieInfo.json */}
      <div className="pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-900">
            영화 상세정보 (searchMovieInfo API)
          </h3>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            movieCd={selectedBoxOffice.movieCd}
          </span>
        </div>

        {isLoadingInfo ? (
          <div className="space-y-3 py-4" aria-live="polite">
            <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
            <div className="h-20 bg-slate-100 rounded w-full animate-pulse" />
            <div className="h-16 bg-slate-100 rounded w-full animate-pulse" />
          </div>
        ) : infoError ? (
          <div className="p-4 border border-red-200 bg-red-50/50 rounded-lg text-xs text-red-700 space-y-2">
            <p className="font-medium">{infoError}</p>
            <button
              type="button"
              onClick={onRetryInfo}
              className="px-3 py-1.5 bg-white border border-red-300 text-red-700 font-medium rounded-md hover:bg-red-50 transition-colors cursor-pointer"
            >
              상세정보 다시 불러오기
            </button>
          </div>
        ) : movieInfo ? (
          <div className="space-y-5 text-xs">
            {/* Basic Production Metadata Table */}
            <dl className="divide-y divide-slate-100 border-t border-b border-slate-100">
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500 shrink-0">제작연도 · 개봉일</dt>
                <dd className="text-slate-900 font-medium text-right font-mono tabular-nums">
                  {movieInfo.prdtYear ? `${movieInfo.prdtYear}년 제작` : '-'} ·{' '}
                  {formatOpenDate(movieInfo.openDt)} 개봉
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500 shrink-0">상영시간 · 관람등급</dt>
                <dd className="text-slate-900 font-medium text-right">
                  <span className="font-mono tabular-nums">
                    {movieInfo.showTm ? `${movieInfo.showTm}분` : '미정'}
                  </span>{' '}
                  · {watchGradeText}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500 shrink-0">심의번호</dt>
                <dd className="text-slate-900 font-mono tabular-nums text-right">
                  {auditNoText}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500 shrink-0">감독</dt>
                <dd className="text-slate-900 font-medium text-right">
                  {movieInfo.directors && movieInfo.directors.length > 0
                    ? movieInfo.directors
                        .map((d) =>
                          d.peopleNmEn ? `${d.peopleNm} (${d.peopleNmEn})` : d.peopleNm
                        )
                        .join(', ')
                    : '정보 없음'}
                </dd>
              </div>
            </dl>

            {/* Cast / Actors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900">
                  출연 배우 ({actorsList.length}명)
                </span>
                {actorsList.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllActors((prev) => !prev)}
                    className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                  >
                    {showAllActors ? '접기' : `전체 보기 (+${actorsList.length - 8}명)`}
                  </button>
                )}
              </div>
              {actorsList.length === 0 ? (
                <p className="text-slate-500">등록된 출연 배우 정보가 없습니다.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {visibleActors.map((actor, idx) => (
                    <div
                      key={`${actor.peopleNm}-${actor.cast}-${idx}`}
                      className="px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="font-medium text-slate-900">{actor.peopleNm}</span>
                        {actor.peopleNmEn && (
                          <span className="ml-1.5 text-slate-400">{actor.peopleNmEn}</span>
                        )}
                      </div>
                      {actor.cast && (
                        <span className="text-slate-500 shrink-0">{actor.cast} 역</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Production & Distribution Companies */}
            <div>
              <span className="block font-semibold text-slate-900 mb-2">
                참여 영화사 ({movieInfo.companys?.length || 0})
              </span>
              {!movieInfo.companys || movieInfo.companys.length === 0 ? (
                <p className="text-slate-500">등록된 영화사 정보가 없습니다.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {movieInfo.companys.map((comp, idx) => (
                    <div
                      key={`${comp.companyCd}-${comp.companyPartNm}-${idx}`}
                      className="px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <span className="text-slate-500 shrink-0">{comp.companyPartNm}</span>
                      <span className="font-medium text-slate-900 text-right truncate">
                        {comp.companyNm}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Show Types (상영형태) */}
            {movieInfo.showTypes && movieInfo.showTypes.length > 0 && (
              <div>
                <span className="block font-semibold text-slate-900 mb-1.5">상영 형태</span>
                <p className="text-slate-600 leading-relaxed">
                  {movieInfo.showTypes
                    .map((st) => `${st.showTypeGroupNm} ${st.showTypeNm}`)
                    .join(' · ')}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
};
