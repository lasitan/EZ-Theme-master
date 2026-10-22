import { XB } from '../endpoints';
import { adminPost, listBody } from './http';

export function fetchAdminCoupons(filter = [], sort = []) {
  return adminPost(XB.admin.coupon.fetch, listBody(filter, sort));
}

export function generateAdminCoupon(body) {
  return adminPost(XB.admin.coupon.generate, body);
}

export function updateAdminCoupon(body) {
  return adminPost(XB.admin.coupon.update, body);
}

export function showAdminCoupon(id, show) {
  return adminPost(XB.admin.coupon.show, { id, show });
}

export function dropAdminCoupon(id) {
  return adminPost(XB.admin.coupon.drop, { id });
}
