import { XB } from '../endpoints';
import { adminGet } from './http';

const TYPE_PATH = {
  order: XB.admin.order.types,
  coupon: XB.admin.coupon.types,
  giftCard: XB.admin.giftCard.types,
  plugin: XB.admin.plugin.types,
  server: XB.admin.server.types,
  user: XB.admin.user.types,
  stat: XB.admin.stat.types
};

const TYPE_FETCH_KEY = {
  order: 'order',
  coupon: 'coupon',
  giftCard: 'gift_card',
  plugin: 'plugin',
  server: 'server',
  user: 'user',
  stat: 'stat'
};

export function fetchAdminTypes(key) {
  return adminGet(TYPE_PATH[key] || XB.admin.typeFetch, TYPE_PATH[key] ? undefined : { key: TYPE_FETCH_KEY[key] || key });
}

export function fetchAdminTypeFallback(key) {
  return adminGet(XB.admin.typeFetch, { key: TYPE_FETCH_KEY[key] || key });
}
