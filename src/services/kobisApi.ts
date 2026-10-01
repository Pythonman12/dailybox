import type {
  DailyBoxOfficeResponse,
  DailyBoxOfficeResult,
  MultiMovieFilter,
  MovieInfo,
  MovieInfoResponse,
  RepNationFilter,
} from '../types/kobis';

export interface FetchDailyBoxOfficeParams {
  targetDt: string; // YYYYMMDD
  repNationCd?: RepNationFilter;
  multiMovieYn?: MultiMovieFilter;
}

const movieInfoClientCache = new Map<string, MovieInfo>();

/**
 * 일일 박스오피스 목록 조회
 * 서버 프록시(/api/boxoffice/daily)를 통해 환경변수(KOBIS_API_KEY)를 참조하여 호출합니다.
 */
export async function fetchDailyBoxOffice({
  targetDt,
  repNationCd = 'ALL',
  multiMovieYn = 'ALL',
}: FetchDailyBoxOfficeParams): Promise<DailyBoxOfficeResult> {
  const params = new URLSearchParams({
    targetDt,
  });

  if (repNationCd !== 'ALL') {
    params.set('repNationCd', repNationCd);
  }
  if (multiMovieYn !== 'ALL') {
    params.set('multiMovieYn', multiMovieYn);
  }

  const response = await fetch(`/api/boxoffice/daily?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `박스오피스 조회 실패 (HTTP ${response.status})`);
  }

  const typed = data as DailyBoxOfficeResponse;
  if (!typed?.boxOfficeResult) {
    throw new Error('유효한 박스오피스 응답 데이터가 없습니다.');
  }

  return typed.boxOfficeResult;
}

/**
 * 영화 상세정보 조회 (movieCd 기준)
 * 서버 프록시(/api/movie/info)를 통해 환경변수(KOBIS_API_KEY)를 참조하여 호출합니다.
 */
export async function fetchMovieInfo(movieCd: string): Promise<MovieInfo> {
  const cached = movieInfoClientCache.get(movieCd);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({ movieCd });
  const response = await fetch(`/api/movie/info?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `영화 상세정보 조회 실패 (HTTP ${response.status})`);
  }

  const typed = data as MovieInfoResponse;
  const movieInfo = typed?.movieInfoResult?.movieInfo;
  if (!movieInfo) {
    throw new Error('영화 상세정보 데이터를 찾을 수 없습니다.');
  }

  movieInfoClientCache.set(movieCd, movieInfo);
  return movieInfo;
}
