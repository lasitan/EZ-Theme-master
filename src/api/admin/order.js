import { XB } from '../endpoints';
import { adminPost, listBody } from './http';

export function fetchAdminOrders(filter = [], sort = []) {
  return adminPost(XB.admin.order.fetch, listBody(filter, sort));
}

export function fetchAdminOrderDetail(id) {
  return adminPost(XB.admin.order.detail, { id });
}

export function commissionAdminOrder(id, action) {
  return adminPost(XB.admin.order.commission, { id, action });
}

export function markAdminOrderPaid(id) {
  return adminPost(XB.admin.order.paid, { id });
}

export function cancelAdminOrder(id) {
  return adminPost(XB.admin.order.cancel, { id });
}

export function updateAdminOrderAmount(id, totalAmount) {
  return adminPost(XB.admin.order.update, { id, total_amount: totalAmount });
}

export function createAdminOrder(body) {
  return adminPost(XB.admin.order.create, body);
}
