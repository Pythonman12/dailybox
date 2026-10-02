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

const DIRECT_KOBIS_DAILY_URL =
  'https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json';
const DIRECT_KOBIS_MOVIE_URL =
  'https://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json';

function getClientApiKey(): string {
  const key = (import.meta.env.VITE_KOBIS_API_KEY || '').trim();
  if (key === 'YOUR_KOBIS_API_KEY') return '';
  return key;
}

/**
 * 일일 박스오피스 목록 조회
 * 기본적으로 /api/boxoffice/daily 서버 엔드포인트를 호출하며,
 * 404나 서버리스 미배포 환경에서는 환경변수(VITE_KOBIS_API_KEY)를 참조하여
 * KOBIS 공식 HTTPS API로 자동 폴백합니다.
 */
export async function fetchDailyBoxOffice({
  targetDt,
  repNationCd = 'ALL',
  multiMovieYn = 'ALL',
}: FetchDailyBoxOfficeParams): Promise<DailyBoxOfficeResult> {
  const params = new URLSearchParams({ targetDt });

  if (repNationCd !== 'ALL') {
    params.set('repNationCd', repNationCd);
  }
  if (multiMovieYn !== 'ALL') {
    params.set('multiMovieYn', multiMovieYn);
  }

  let response: Response;
  try {
    response = await fetch(`/api/boxoffice/daily?${params.toString()}`);
  } catch (netErr) {
    // If local network to /api failed, try direct KOBIS fallback if client key exists
    const clientKey = getClientApiKey();
    if (clientKey) {
      params.set('key', clientKey);
      response = await fetch(`${DIRECT_KOBIS_DAILY_URL}?${params.toString()}`);
    } else {
      throw netErr;
    }
  }

  // If /api endpoint returned 404 (e.g. Vercel static routing without serverless function)
  if (response.status === 404) {
    const clientKey = getClientApiKey();
    if (clientKey) {
      params.set('key', clientKey);
      response = await fetch(`${DIRECT_KOBIS_DAILY_URL}?${params.toString()}`);
    }
  }

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
 */
export async function fetchMovieInfo(movieCd: string): Promise<MovieInfo> {
  const cached = movieInfoClientCache.get(movieCd);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({ movieCd });
  let response: Response;

  try {
    response = await fetch(`/api/movie/info?${params.toString()}`);
  } catch (netErr) {
    const clientKey = getClientApiKey();
    if (clientKey) {
      params.set('key', clientKey);
      response = await fetch(`${DIRECT_KOBIS_MOVIE_URL}?${params.toString()}`);
    } else {
      throw netErr;
    }
  }

  if (response.status === 404) {
    const clientKey = getClientApiKey();
    if (clientKey) {
      params.set('key', clientKey);
      response = await fetch(`${DIRECT_KOBIS_MOVIE_URL}?${params.toString()}`);
    }
  }

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
