export function formatUnix(ts) {
  if (ts == null || ts === '') return '—';
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const ms = n > 1e12 ? n : n * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function yuanFromCent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return (n / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function centFromYuan(raw) {
  const n = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(n)) throw new Error('金额无效');
  return Math.round(n * 100);
}

export function formatYmd(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function lastDaysRange(days) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return {
    startYmd: formatYmd(start),
    endYmd: formatYmd(end),
    startUnix: Math.floor(start.getTime() / 1000),
    endUnix: Math.floor(Date.now() / 1000)
  };
}

export function textOf(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function flagOn(value) {
  return value === true || value === 1 || value === '1';
}

export function localInputToUnix(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 1000);
}

export function unixToLocalInput(ts) {
  if (ts == null || ts === '') return '';
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return '';
  const ms = n > 1e12 ? n : n * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
