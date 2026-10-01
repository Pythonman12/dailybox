import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const KOBIS_DAILY_URL =
  'http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json';
const KOBIS_MOVIE_INFO_URL =
  'http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json';

// In-memory cache to speed up repeated date/movie lookups
const dailyBoxOfficeCache = new Map<string, { timestamp: number; data: unknown }>();
const movieInfoCache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function getKobisApiKey(): string {
  let key = process.env.KOBIS_API_KEY || process.env.VITE_KOBIS_API_KEY || '';
  if (key === 'YOUR_KOBIS_API_KEY') {
    key = '';
  }
  return key.trim();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. 일일 박스오피스 조회 API Proxy
  app.get('/api/boxoffice/daily', async (req: Request, res: Response) => {
    try {
      const apiKey = getKobisApiKey();
      if (!apiKey) {
        res.status(500).json({
          error: '서버 환경변수(KOBIS_API_KEY)가 설정되지 않았습니다.',
        });
        return;
      }

      const targetDt = String(req.query.targetDt || '').replace(/[^0-9]/g, '');
      if (targetDt.length !== 8) {
        res.status(400).json({
          error: '조회 날짜(targetDt)는 YYYYMMDD 8자리 형식이어야 합니다.',
        });
        return;
      }

      const multiMovieYn = String(req.query.multiMovieYn || '').trim();
      const repNationCd = String(req.query.repNationCd || '').trim();
      const itemPerPage = String(req.query.itemPerPage || '10').trim();

      const cacheKey = `${targetDt}:${multiMovieYn}:${repNationCd}:${itemPerPage}`;
      const cached = dailyBoxOfficeCache.get(cacheKey);
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

      dailyBoxOfficeCache.set(cacheKey, { timestamp: Date.now(), data });
      res.json(data);
    } catch (error) {
      console.error('Error fetching daily box office:', error);
      res.status(500).json({
        error: '일일 박스오피스 데이터를 불러오는 중 네트워크 오류가 발생했습니다.',
      });
    }
  });

  // 2. 영화 상세정보 조회 API Proxy
  app.get('/api/movie/info', async (req: Request, res: Response) => {
    try {
      const apiKey = getKobisApiKey();
      if (!apiKey) {
        res.status(500).json({
          error: '서버 환경변수(KOBIS_API_KEY)가 설정되지 않았습니다.',
        });
        return;
      }

      const movieCd = String(req.query.movieCd || '').trim();
      if (!movieCd) {
        res.status(400).json({
          error: '영화코드(movieCd)가 필요합니다.',
        });
        return;
      }

      const cached = movieInfoCache.get(movieCd);
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

      movieInfoCache.set(movieCd, { timestamp: Date.now(), data });
      res.json(data);
    } catch (error) {
      console.error('Error fetching movie info:', error);
      res.status(500).json({
        error: '영화 상세정보를 불러오는 중 네트워크 오류가 발생했습니다.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KOBIS Box Office Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
