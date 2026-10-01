export interface DailyBoxOfficeItem {
  rnum: string;
  rank: string;
  rankInten: string;
  rankOldAndNew: 'OLD' | 'NEW' | string;
  movieCd: string;
  movieNm: string;
  openDt: string;
  salesAmt: string;
  salesShare: string;
  salesInten: string;
  salesChange: string;
  salesAcc: string;
  audiCnt: string;
  audiInten: string;
  audiChange: string;
  audiAcc: string;
  scrnCnt: string;
  showCnt: string;
}

export interface DailyBoxOfficeResult {
  boxofficeType: string;
  showRange: string;
  dailyBoxOfficeList: DailyBoxOfficeItem[];
}

export interface DailyBoxOfficeResponse {
  boxOfficeResult: DailyBoxOfficeResult;
}

export interface MovieNation {
  nationNm: string;
}

export interface MovieGenre {
  genreNm: string;
}

export interface MovieDirector {
  peopleNm: string;
  peopleNmEn: string;
}

export interface MovieActor {
  peopleNm: string;
  peopleNmEn: string;
  cast: string;
  castEn: string;
}

export interface MovieShowType {
  showTypeGroupNm: string;
  showTypeNm: string;
}

export interface MovieCompany {
  companyCd: string;
  companyNm: string;
  companyNmEn: string;
  companyPartNm: string;
}

export interface MovieAudit {
  auditNo: string;
  watchGradeNm: string;
}

export interface MovieStaff {
  peopleNm: string;
  peopleNmEn: string;
  staffRoleNm: string;
}

export interface MovieInfo {
  movieCd: string;
  movieNm: string;
  movieNmEn: string;
  movieNmOg: string;
  showTm: string;
  prdtYear: string;
  openDt: string;
  prdtStatNm: string;
  typeNm: string;
  nations: MovieNation[];
  genres: MovieGenre[];
  directors: MovieDirector[];
  actors: MovieActor[];
  showTypes: MovieShowType[];
  companys: MovieCompany[];
  audits: MovieAudit[];
  staffs: MovieStaff[];
}

export interface MovieInfoResult {
  movieInfo: MovieInfo;
  source: string;
}

export interface MovieInfoResponse {
  movieInfoResult: MovieInfoResult;
}

export type RepNationFilter = 'ALL' | 'K' | 'F';
export type MultiMovieFilter = 'ALL' | 'N' | 'Y';
export type SortField = 'rank' | 'audiCnt' | 'audiAcc' | 'salesAmt' | 'scrnCnt';
