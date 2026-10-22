export const ORDER_TYPE_LABELS = { 1: '新购', 2: '续费', 3: '升级', 4: '流量重置' };
export const ORDER_STATUS_LABELS = { 0: '待支付', 1: '开通中', 2: '已取消', 3: '已完成', 4: '已折抵' };
export const COMMISSION_STATUS_LABELS = { 0: '待确认', 1: '发放中', 2: '有效', 3: '无效' };

export const PERIOD_LABELS = {
  monthly: '月付',
  quarterly: '季付',
  half_yearly: '半年付',
  yearly: '年付',
  two_year: '两年付',
  three_year: '三年付',
  onetime: '流量包',
  reset_traffic: '重置包'
};

export const PLAN_PRICE_FIELDS = [
  { field: 'month_price', period: 'monthly', label: '月付' },
  { field: 'quarter_price', period: 'quarterly', label: '季付' },
  { field: 'half_year_price', period: 'half_yearly', label: '半年付' },
  { field: 'year_price', period: 'yearly', label: '年付' },
  { field: 'two_year_price', period: 'two_year', label: '两年付' },
  { field: 'three_year_price', period: 'three_year', label: '三年付' },
  { field: 'onetime_price', period: 'onetime', label: '流量包' },
  { field: 'reset_price', period: 'reset_traffic', label: '重置包' }
];

export const NODE_TYPE_FALLBACK = [
  'shadowsocks', 'vmess', 'vless', 'trojan', 'hysteria', 'tuic', 'anytls', 'socks', 'naive', 'http', 'mieru'
];

export function labelOf(map, value) {
  const n = Number(value);
  if (Object.prototype.hasOwnProperty.call(map, n)) return map[n];
  if (value == null || value === '') return '—';
  return String(value);
}
