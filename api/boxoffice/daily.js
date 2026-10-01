const KOBIS_DAILY_URL =
  'http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json';

// In-memory cache for serverless invocation
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let apiKey = (process.env.KOBIS_API_KEY || process.env.VITE_KOBIS_API_KEY || '').trim();
    if (apiKey === 'YOUR_KOBIS_API_KEY') {
      apiKey = '';
    }
    if (!apiKey) {
      res.status(500).json({
        error: '서버 환경변수(KOBIS_API_KEY)가 설정되지 않았습니다. Vercel 환경변수에 KOBIS_API_KEY를 등록해주세요.',
      });
      return;
    }

    const query = req.query || {};
    const targetDt = String(query.targetDt || '').replace(/[^0-9]/g, '');
    if (targetDt.length !== 8) {
      res.status(400).json({
        error: '조회 날짜(targetDt)는 YYYYMMDD 8자리 형식이어야 합니다.',
      });
      return;
    }

    const multiMovieYn = String(query.multiMovieYn || '').trim();
    const repNationCd = String(query.repNationCd || '').trim();
    const itemPerPage = String(query.itemPerPage || '10').trim();

    const cacheKey = `${targetDt}:${multiMovieYn}:${repNationCd}:${itemPerPage}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.json(cached.data);
      return;
    }

    const params = new URLSearchParams({
      key: apiKey,
      targetDt,
      itemPerPage,
    });

    if (multiMovieYn === 'Y' || multiMovieYn === 'N') {
      params.set('multiMovieYn', multiMovieYn);
    }
    if (repNationCd === 'K' || repNationCd === 'F') {
      params.set('repNationCd', repNationCd);
    }

    const response = await fetch(`${KOBIS_DAILY_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `영화진흥위원회 API 응답 오류 (HTTP ${response.status})`,
      });
      return;
    }

    const data = await response.json();

    if (data?.faultInfo) {
      res.status(400).json({
        error: data.faultInfo.message || 'KOBIS API 요청 처리 중 오류가 발생했습니다.',
        code: data.faultInfo.errorCode,
      });
      return;
    }

    cache.set(cacheKey, { timestamp: Date.now(), data });
    res.json(data);
  } catch (error) {
    console.error('Error fetching daily box office in Vercel API:', error);
    res.status(500).json({
      error: '일일 박스오피스 데이터를 불러오는 중 오류가 발생했습니다.',
    });
  }
}
