const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 로컬 시간 기준 오늘 날짜(00:00:00)의 Date 객체를 반환합니다.
 */
export function getTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * 오늘 이전 날짜 중 가장 최신일인 '어제(오늘 - 1일)'를 YYYY-MM-DD 형식으로 반환합니다.
 */
export function getYesterdayDateString(): string {
  const today = getTodayLocal();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return formatDateToInput(yesterday);
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 */
export function getTodayDateString(): string {
  return formatDateToInput(getTodayLocal());
}

/**
 * Date 객체를 YYYY-MM-DD 문자열로 변환합니다.
 */
export function formatDateToInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 문자열을 KOBIS API용 YYYYMMDD 8자리 문자열로 변환합니다.
 */
export function toTargetDt(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/**
 * YYYYMMDD 8자리 문자열을 YYYY-MM-DD 형식으로 변환합니다.
 */
export function fromTargetDt(targetDt: string): string {
  const clean = targetDt.replace(/[^0-9]/g, '');
  if (clean.length !== 8) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
}

/**
 * 선택한 날짜(YYYY-MM-DD)가 오늘 이전(<= 어제)인지 검증합니다.
 */
export function isDateBeforeToday(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const maxDate = getYesterdayDateString();
  return dateStr <= maxDate && dateStr >= '2004-01-01';
}

/**
 * 오늘 이후 날짜가 입력된 경우 어제 날짜로 보정합니다.
 */
export function clampToBeforeToday(dateStr: string): string {
  const maxDate = getYesterdayDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return maxDate;
  if (dateStr > maxDate) return maxDate;
  if (dateStr < '2004-01-01') return '2004-01-01';
  return dateStr;
}

/**
 * 기준 날짜(YYYY-MM-DD)에서 지정한 일수만큼 이동한 날짜를 반환합니다 (최대 어제까지만 허용).
 */
export function shiftDateString(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return clampToBeforeToday(formatDateToInput(date));
}

/**
 * YYYY-MM-DD 문자열을 "2026년 09월 30일 (수)" 형식으로 변환합니다.
 */
export function formatKoreanDateFull(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAYS_KO[date.getDay()];
  return `${y}년 ${String(m).padStart(2, '0')}월 ${String(d).padStart(2, '0')}일 (${weekday})`;
}

/**
 * YYYYMMDD 또는 YYYY-MM-DD 개봉일을 "2026.09.30" 형식으로 정리합니다.
 */
export function formatOpenDate(openDt: string): string {
  if (!openDt || openDt.trim() === '') return '미정';
  const clean = openDt.replace(/[^0-9]/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 8)}`;
  }
  return openDt.trim();
}

/**
 * 숫자를 천 단위 콤마 문자열로 포맷합니다.
 */
export function formatNumber(value: string | number): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString('ko-KR');
}

/**
 * 원화 매출액을 읽기 쉬운 한국어 단위(억/만 원)로 변환합니다.
 */
export function formatKoreanCurrencyCompact(value: string | number): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num) || num === 0) return '0원';

  const eok = Math.floor(num / 100_000_000);
  const man = Math.floor((num % 100_000_000) / 10_000);

  if (eok > 0 && man > 0) {
    return `${eok.toLocaleString('ko-KR')}억 ${man.toLocaleString('ko-KR')}만 원`;
  }
  if (eok > 0) {
    return `${eok.toLocaleString('ko-KR')}억 원`;
  }
  if (man > 0) {
    return `${man.toLocaleString('ko-KR')}만 원`;
  }
  return `${num.toLocaleString('ko-KR')}원`;
}
