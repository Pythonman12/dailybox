const KOBIS_MOVIE_INFO_URL =
  'http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json';

const cache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export default async function handler(req: any, res: any) {
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
    const movieCd = String(query.movieCd || '').trim();
    if (!movieCd) {
      res.status(400).json({
        error: '영화코드(movieCd)가 필요합니다.',
      });
      return;
    }

    const cached = cache.get(movieCd);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.json(cached.data);
      return;
    }

    const params = new URLSearchParams({
      key: apiKey,
      movieCd,
    });

    const response = await fetch(`${KOBIS_MOVIE_INFO_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `영화 상세정보 API 응답 오류 (HTTP ${response.status})`,
      });
      return;
    }

    const data = await response.json();

    if (data?.faultInfo) {
      res.status(400).json({
        error: data.faultInfo.message || '영화 상세정보 조회 중 오류가 발생했습니다.',
        code: data.faultInfo.errorCode,
      });
      return;
    }

    cache.set(movieCd, { timestamp: Date.now(), data });
    res.json(data);
  } catch (error) {
    console.error('Error fetching movie info in Vercel API:', error);
    res.status(500).json({
      error: '영화 상세정보를 불러오는 중 오류가 발생했습니다.',
    });
  }
}
