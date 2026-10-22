import { XB } from '../endpoints';
import { adminGet, adminPost } from './http';

export function fetchAdminNodes() {
  return adminGet(XB.admin.server.getNodes);
}

export function fetchProtocolMeta() {
  return adminGet(XB.admin.server.getProtocolMeta);
}

export function fetchServerGroups() {
  return adminGet(XB.admin.server.groupFetch);
}

export function fetchServerRoutes() {
  return adminGet(XB.admin.server.routeFetch);
}

export function saveAdminNode(body) {
  return adminPost(XB.admin.server.save, body);
}

export function updateAdminNode(body) {
  return adminPost(XB.admin.server.update, body);
}

export function copyAdminNode(id) {
  return adminPost(XB.admin.server.copy, { id });
}

export function dropAdminNode(id) {
  return adminPost(XB.admin.server.drop, { id });
}
