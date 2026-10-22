import { XB } from '../endpoints';
import { adminGet, adminPost } from './http';

export function fetchAdminPayments() {
  return adminGet(XB.admin.payment.fetch);
}

export function fetchPaymentMethods() {
  return adminGet(XB.admin.payment.getPaymentMethods);
}

export function fetchPaymentForm(body) {
  return adminPost(XB.admin.payment.getPaymentForm, body);
}

export function saveAdminPayment(body) {
  return adminPost(XB.admin.payment.save, body);
}

export function showAdminPayment(id, enable) {
  return adminPost(XB.admin.payment.show, { id, enable });
}

export function dropAdminPayment(id) {
  return adminPost(XB.admin.payment.drop, { id });
}

export function sortAdminPayments(ids) {
  return adminPost(XB.admin.payment.sort, { ids });
}
