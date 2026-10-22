import { XB } from '../endpoints';
import { adminGet, adminPost, adminRequest, listBody } from './http';

export function fetchAdminUsers(filter = [], sort = []) {
  return adminPost(XB.admin.user.fetch, listBody(filter, sort));
}

export function updateAdminUser(body) {
  return adminPost(XB.admin.user.update, body);
}

export function setInviteUser(body) {
  return adminPost(XB.admin.user.setInviteUser, body);
}

export function banAdminUser(body) {
  return adminPost(XB.admin.user.ban, body);
}

export function resetAdminUserSecret(id) {
  return adminPost(XB.admin.user.resetSecret, { id });
}

export function destroyAdminUser(id) {
  return adminPost(XB.admin.user.destroy, { id });
}

export function generateAdminUsers(users) {
  return adminPost(XB.admin.user.generate, { users });
}

export function sendAdminMail(body) {
  return adminPost(XB.admin.user.sendMail, body);
}

export function dumpAdminUsersCsv() {
  return adminRequest({
    url: XB.admin.user.dumpCSV,
    method: 'post',
    data: { limit: 2000 },
    json: true,
    responseType: 'blob'
  });
}

export function fetchAdminUserById(id) {
  return adminGet(XB.admin.user.getUserInfoById, { id });
}

export function fetchAdminUserTraffic(body) {
  return adminPost(XB.admin.user.trafficLog, body);
}
