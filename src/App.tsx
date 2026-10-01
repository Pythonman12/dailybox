import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ArrowUpDown, Download, RefreshCw, Search, X } from 'lucide-react';
import { AnalyticsSection } from './components/AnalyticsSection';
import { DateNavigator } from './components/DateNavigator';
import { MovieDetailPanel } from './components/MovieDetailPanel';
import { fetchDailyBoxOffice, fetchMovieInfo } from './services/kobisApi';
import type {
  DailyBoxOfficeItem,
  MultiMovieFilter,
  MovieInfo,
  RepNationFilter,
  SortField,
} from './types/kobis';
import {
  clampToBeforeToday,
  formatKoreanCurrencyCompact,
  formatKoreanDateFull,
  formatNumber,
  formatOpenDate,
  getYesterdayDateString,
  toTargetDt,
} from './utils/dateUtils';

export function App() {
  // 기본 선택일: 오늘 이전 날짜 중 가장 최신일인 '어제'
  const [selectedDate, setSelectedDate] = useState<string>(() => getYesterdayDateString());
  const [repNationCd, setRepNationCd] = useState<RepNationFilter>('ALL');
  const [multiMovieYn, setMultiMovieYn] = useState<MultiMovieFilter>('ALL');

  // 일일 박스오피스 상태
  const [boxOfficeList, setBoxOfficeList] = useState<DailyBoxOfficeItem[]>([]);
  const [boxOfficeType, setBoxOfficeType] = useState<string>('일별 박스오피스');
  const [showRange, setShowRange] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  // 테이블 검색 및 정렬 상태
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('rank');

  // 선택된 영화 및 영화 상세정보(searchMovieInfo) 상태
  const [selectedMovie, setSelectedMovie] = useState<DailyBoxOfficeItem | null>(null);
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState<boolean>(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const handleSelectDate = useCallback((newDate: string) => {
    setSelectedDate(clampToBeforeToday(newDate));
  }, []);

  // 일일 박스오피스 조회
  const loadDailyBoxOffice = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const targetDt = toTargetDt(selectedDate);
      const result = await fetchDailyBoxOffice({
        targetDt,
        repNationCd,
        multiMovieYn,
      });

      const list = result.dailyBoxOfficeList || [];
      setBoxOfficeList(list);
      setBoxOfficeType(result.boxofficeType || '일별 박스오피스');
      setShowRange(result.showRange || `${targetDt}~${targetDt}`);

      if (list.length > 0) {
        setSelectedMovie((prev) => {
          if (prev) {
            const matched = list.find((item) => item.movieCd === prev.movieCd);
            if (matched) return matched;
          }
          return list[0];
        });
      } else {
        setSelectedMovie(null);
        setMovieInfo(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '박스오피스 데이터를 불러오지 못했습니다.';
      setListError(message);
      setBoxOfficeList([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [selectedDate, repNationCd, multiMovieYn]);

  useEffect(() => {
    loadDailyBoxOffice();
  }, [loadDailyBoxOffice]);

  // 선택된 영화의 상세정보(searchMovieInfo.json) 조회
  const loadMovieDetail = useCallback(async (movieCd: string) => {
    setIsLoadingInfo(true);
    setInfoError(null);
    try {
      const info = await fetchMovieInfo(movieCd);
      setMovieInfo(info);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '영화 상세정보를 불러오지 못했습니다.';
      setInfoError(message);
      setMovieInfo(null);
    } finally {
      setIsLoadingInfo(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMovie?.movieCd) {
      loadMovieDetail(selectedMovie.movieCd);
    } else {
      setMovieInfo(null);
    }
  }, [selectedMovie?.movieCd, loadMovieDetail]);

  // 검색 및 정렬이 적용된 목록
  const filteredAndSortedList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = boxOfficeList.filter((item) => {
      if (!q) return true;
      return (
        item.movieNm.toLowerCase().includes(q) ||
        item.movieCd.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortField === 'rank') {
        return Number(a.rank) - Number(b.rank);
      }
      return Number(b[sortField]) - Number(a[sortField]);
    });
  }, [boxOfficeList, searchQuery, sortField]);

  // 일일 요약 통계 계산
  const summaryStats = useMemo(() => {
    const totalAudi = boxOfficeList.reduce((sum, i) => sum + (Number(i.audiCnt) || 0), 0);
    const totalAudiInten = boxOfficeList.reduce(
      (sum, i) => sum + (Number(i.audiInten) || 0),
      0
    );
    const totalSales = boxOfficeList.reduce((sum, i) => sum + (Number(i.salesAmt) || 0), 0);
    const totalScreens = boxOfficeList.reduce((sum, i) => sum + (Number(i.scrnCnt) || 0), 0);
    const totalShows = boxOfficeList.reduce((sum, i) => sum + (Number(i.showCnt) || 0), 0);
    const newEntriesCount = boxOfficeList.filter((i) => i.rankOldAndNew === 'NEW').length;
    const topMovie = boxOfficeList[0] || null;

    return {
      totalAudi,
      totalAudiInten,
      totalSales,
      totalScreens,
      totalShows,
      newEntriesCount,
      topMovie,
    };
  }, [boxOfficeList]);

  // CSV 다운로드 핸들러
  const handleExportCsv = () => {
    if (boxOfficeList.length === 0) return;

    const headers = [
      '순위',
      '전일대비순위증감',
      '신규진입여부',
      '영화코드',
      '영화명',
      '개봉일',
      '일일관객수',
      '관객수증감율(%)',
      '누적관객수',
      '일일매출액(원)',
      '매출점유율(%)',
      '누적매출액(원)',
      '스크린수',
      '상영횟수',
    ];

    const rows = boxOfficeList.map((item) => [
      item.rank,
      item.rankInten,
      item.rankOldAndNew,
      item.movieCd,
      `"${item.movieNm.replace(/"/g, '""')}"`,
      item.openDt,
      item.audiCnt,
      item.audiChange,
      item.audiAcc,
      item.salesAmt,
      item.salesShare,
      item.salesAcc,
      item.scrnCnt,
      item.showCnt,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kobis_daily_boxoffice_${toTargetDt(selectedDate)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900">
      {/* Top Bar Contract: 3 Zones (Brand Wordmark — 4 Nav Links — Primary Action) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-lg font-extrabold tracking-tight text-slate-900 font-display whitespace-nowrap"
          >
            KOBIS BoxOffice
          </a>

          {/* Zone 2: 4 clean text navigation links */}
          <nav
            aria-label="주요 섹션 탐색"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => scrollToSection('ranking-section')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
            >
              일일 순위표
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('movie-detail-section')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
            >
              상세 영화정보
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('analytics-section')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
            >
              점유율 분석
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('efficiency-section')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
            >
              상영 효율
            </button>
          </nav>

          {/* Zone 3: Primary action */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={boxOfficeList.length === 0 || isLoadingList}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>
      </header>

      {/* Date Selection & Official Parameter Filters */}
      <DateNavigator
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        repNationCd={repNationCd}
        onChangeRepNation={setRepNationCd}
        multiMovieYn={multiMovieYn}
        onChangeMultiMovie={setMultiMovieYn}
        isLoading={isLoadingList}
      />

      {/* Main Content Container */}
      <main id="top" className="flex-1">
        {/* Daily Summary KPI Strip */}
        <section
          aria-label="일일 박스오피스 핵심 지표 요약"
          className="max-w-[1360px] mx-auto px-6 pt-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {/* Metric 1: Top 10 Daily Audience */}
            <div className="bg-white p-5">
              <span className="block text-xs text-slate-500">
                Top 10 일일 관객수 합계
              </span>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {isLoadingList ? '—' : `${formatNumber(summaryStats.totalAudi)}명`}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                {isLoadingList
                  ? '집계 중...'
                  : `전일 대비 증감 ${
                      summaryStats.totalAudiInten >= 0 ? '+' : ''
                    }${formatNumber(summaryStats.totalAudiInten)}명`}
              </p>
            </div>

            {/* Metric 2: Top 10 Daily Sales */}
            <div className="bg-white p-5">
              <span className="block text-xs text-slate-500">
                Top 10 일일 매출액 합계
              </span>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {isLoadingList
                  ? '—'
                  : formatKoreanCurrencyCompact(summaryStats.totalSales)}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                {isLoadingList
                  ? '집계 중...'
                  : `${formatNumber(summaryStats.totalSales)}원`}
              </p>
            </div>

            {/* Metric 3: #1 Movie */}
            <div className="bg-white p-5">
              <span className="block text-xs text-slate-500">박스오피스 1위 작품</span>
              <p className="mt-1.5 text-lg font-bold text-slate-900 truncate">
                {isLoadingList
                  ? '—'
                  : summaryStats.topMovie
                  ? summaryStats.topMovie.movieNm
                  : '데이터 없음'}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                {isLoadingList || !summaryStats.topMovie
                  ? '—'
                  : `일일 ${formatNumber(summaryStats.topMovie.audiCnt)}명 · 점유율 ${
                      summaryStats.topMovie.salesShare
                    }%`}
              </p>
            </div>

            {/* Metric 4: Total Screens & New Entries */}
            <div className="bg-white p-5">
              <span className="block text-xs text-slate-500">
                상영관 연인원 · 신규 진입
              </span>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {isLoadingList
                  ? '—'
                  : `${formatNumber(summaryStats.totalShows)}회 상영`}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                {isLoadingList
                  ? '집계 중...'
                  : `신규 진입(NEW) ${summaryStats.newEntriesCount}편 · 조회범위 ${showRange}`}
              </p>
            </div>
          </div>
        </section>

        {/* Primary Workspace: 12-Column Split (7 Cols Ranking Table + 5 Cols Movie Detail Inspector) */}
        <section
          id="ranking-section"
          aria-label="일일 박스오피스 순위 및 영화 상세정보"
          className="max-w-[1360px] mx-auto px-6 py-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Daily Box Office Table */}
            <div className="lg:col-span-7 space-y-4">
              {/* Table Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight font-display">
                    01. {boxOfficeType} Top 10
                  </h2>
                  <p className="text-xs text-slate-500">
                    영화를 클릭하면 우측 패널에 영화진흥위원회 상세정보(searchMovieInfo)가 연동됩니다.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="영화명·코드 검색..."
                      aria-label="목록 내 영화명 또는 영화코드 검색"
                      className="pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 w-44"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="검색어 지우기"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort Select */}
                  <div className="relative flex items-center">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select
                      aria-label="정렬 기준 선택"
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="pl-8 pr-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
                    >
                      <option value="rank">순위순</option>
                      <option value="audiCnt">일일 관객수순</option>
                      <option value="audiAcc">누적 관객수순</option>
                      <option value="salesAmt">일일 매출액순</option>
                      <option value="scrnCnt">스크린수순</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={loadDailyBoxOffice}
                    disabled={isLoadingList}
                    title="새로고침"
                    className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Box Office Table Card */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {listError ? (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-sm font-semibold text-red-700">{listError}</p>
                    <p className="text-xs text-slate-500">
                      선택하신 날짜({selectedDate})의 네트워크 상태나 환경변수 설정을 확인해주세요.
                    </p>
                    <button
                      type="button"
                      onClick={loadDailyBoxOffice}
                      className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      다시 조회하기
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                          <th className="py-3 pl-4 pr-2 w-16">순위</th>
                          <th className="py-3 px-3">영화명 · 개봉일</th>
                          <th className="py-3 px-3 text-right">일일 관객수</th>
                          <th className="py-3 px-3 text-right hidden sm:table-cell">
                            누적 관객수
                          </th>
                          <th className="py-3 px-3 text-right hidden md:table-cell">
                            일일 매출 · 점유율
                          </th>
                          <th className="py-3 pl-2 pr-4 text-right hidden xl:table-cell">
                            스크린 · 상영
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {isLoadingList ? (
                          Array.from({ length: 10 }).map((_, idx) => (
                            <tr key={`skeleton-${idx}`} className="h-[58px]">
                              <td className="py-3 pl-4 pr-2">
                                <div className="h-4 w-8 bg-slate-100 rounded animate-pulse" />
                              </td>
                              <td className="py-3 px-3">
                                <div className="h-4 w-44 bg-slate-100 rounded animate-pulse mb-1.5" />
                                <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse ml-auto mb-1" />
                                <div className="h-3 w-12 bg-slate-100 rounded animate-pulse ml-auto" />
                              </td>
                              <td className="py-3 px-3 text-right hidden sm:table-cell">
                                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse ml-auto" />
                              </td>
                              <td className="py-3 px-3 text-right hidden md:table-cell">
                                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse ml-auto" />
                              </td>
                              <td className="py-3 pl-2 pr-4 text-right hidden xl:table-cell">
                                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse ml-auto" />
                              </td>
                            </tr>
                          ))
                        ) : filteredAndSortedList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 px-6 text-center space-y-2">
                              <p className="text-sm font-medium text-slate-700">
                                조회된 박스오피스 내역이 없습니다.
                              </p>
                              <p className="text-xs text-slate-500">
                                검색어나 필터 조건을 변경하거나 다른 날짜를 선택해 보세요.
                              </p>
                              {(searchQuery ||
                                repNationCd !== 'ALL' ||
                                multiMovieYn !== 'ALL') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery('');
                                    setRepNationCd('ALL');
                                    setMultiMovieYn('ALL');
                                  }}
                                  className="mt-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                                >
                                  필터 및 검색 초기화
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredAndSortedList.map((item) => {
                            const isSelected = selectedMovie?.movieCd === item.movieCd;
                            const rankIntenNum = Number(item.rankInten || 0);
                            const audiChangeNum = Number(item.audiChange || 0);
                            const rankNum = Number(item.rank);

                            return (
                              <tr
                                key={item.movieCd}
                                onClick={() => setSelectedMovie(item)}
                                className={`transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-red-50/70 hover:bg-red-50'
                                    : 'hover:bg-slate-50/90'
                                }`}
                              >
                                {/* Rank & Rank Change */}
                                <td className="py-3 pl-4 pr-2 align-middle font-mono tabular-nums">
                                  <div className="flex items-baseline gap-1.5">
                                    <span
                                      className={`text-base font-bold ${
                                        rankNum === 1
                                          ? 'text-red-600'
                                          : rankNum <= 3
                                          ? 'text-slate-900'
                                          : 'text-slate-600'
                                      }`}
                                    >
                                      {item.rank}
                                    </span>
                                    {item.rankOldAndNew === 'NEW' ? (
                                      <span className="text-[10px] font-semibold text-amber-700">
                                        NEW
                                      </span>
                                    ) : rankIntenNum > 0 ? (
                                      <span className="text-[10px] font-medium text-emerald-700">
                                        ▲{rankIntenNum}
                                      </span>
                                    ) : rankIntenNum < 0 ? (
                                      <span className="text-[10px] font-medium text-red-600">
                                        ▼{Math.abs(rankIntenNum)}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">-</span>
                                    )}
                                  </div>
                                </td>

                                {/* Movie Title & Open Date */}
                                <td className="py-3 px-3 align-middle">
                                  <div className="font-semibold text-slate-900 text-sm leading-snug">
                                    {item.movieNm}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
                                    <span>개봉 {formatOpenDate(item.openDt)}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>코드 {item.movieCd}</span>
                                  </div>
                                </td>

                                {/* Daily Audience & Change */}
                                <td className="py-3 px-3 text-right align-middle font-mono tabular-nums">
                                  <div className="font-semibold text-slate-900">
                                    {formatNumber(item.audiCnt)}명
                                  </div>
                                  <div
                                    className={`text-[11px] ${
                                      audiChangeNum > 0
                                        ? 'text-emerald-700'
                                        : audiChangeNum < 0
                                        ? 'text-red-600'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {audiChangeNum > 0 ? `+${item.audiChange}%` : `${item.audiChange}%`}
                                  </div>
                                </td>

                                {/* Cumulative Audience */}
                                <td className="py-3 px-3 text-right align-middle font-mono tabular-nums hidden sm:table-cell">
                                  <div className="font-medium text-slate-800">
                                    {formatNumber(item.audiAcc)}명
                                  </div>
                                </td>

                                {/* Daily Sales & Share */}
                                <td className="py-3 px-3 text-right align-middle font-mono tabular-nums hidden md:table-cell">
                                  <div className="font-medium text-slate-900">
                                    {formatKoreanCurrencyCompact(item.salesAmt)}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    점유율 {item.salesShare}%
                                  </div>
                                </td>

                                {/* Screens & Shows */}
                                <td className="py-3 pl-2 pr-4 text-right align-middle font-mono tabular-nums hidden xl:table-cell">
                                  <div className="text-slate-800">
                                    {formatNumber(item.scrnCnt)}개관
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {formatNumber(item.showCnt)}회
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Movie Detail Inspector (searchMovieInfo.json) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20">
              <MovieDetailPanel
                selectedBoxOffice={selectedMovie}
                movieInfo={movieInfo}
                isLoadingInfo={isLoadingInfo}
                infoError={infoError}
                onRetryInfo={() => {
                  if (selectedMovie?.movieCd) {
                    loadMovieDetail(selectedMovie.movieCd);
                  }
                }}
                selectedDateFormatted={formatKoreanDateFull(selectedDate)}
              />
            </div>
          </div>
        </section>

        {/* Market Share & Efficiency Analytics Section */}
        <AnalyticsSection
          items={boxOfficeList}
          selectedMovieCd={selectedMovie?.movieCd || null}
          onSelectMovie={(item) => {
            setSelectedMovie(item);
            scrollToSection('movie-detail-section');
          }}
          selectedDateFormatted={formatKoreanDateFull(selectedDate)}
        />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[1360px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-800">KOBIS BoxOffice</span>
            <span aria-hidden="true">·</span>
            <span>영화관입장권통합전산망 오픈API 연동</span>
            <span aria-hidden="true">·</span>
            <span>일일 박스오피스 및 영화 상세정보 조회 시스템</span>
          </div>
          <div className="text-slate-400">
            데이터 출처: 영화진흥위원회 (KOFIC / KOBIS Open API)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
