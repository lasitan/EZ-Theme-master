import { XB } from '../endpoints';
import { adminGet, adminPost, adminSend } from './http';

export function fetchAdminNotices() {
  return adminGet(XB.admin.notice.fetch);
}

export function createAdminNotice(body) {
  return adminPost(XB.admin.notice.item, body);
}

export function updateAdminNotice(body) {
  return adminSend(XB.admin.notice.item, 'put', body);
}

export function deleteAdminNotice(id) {
  return adminSend(XB.admin.notice.item, 'delete', { id });
}

export function showAdminNotice(id, show) {
  return adminPost(XB.admin.notice.show, { id, show });
}

export function sortAdminNotices(ids) {
  return adminPost(XB.admin.notice.sort, { ids });
}
