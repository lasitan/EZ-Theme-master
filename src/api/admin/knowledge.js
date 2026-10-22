import { XB } from '../endpoints';
import { adminGet, adminPost, adminSend } from './http';

export function fetchAdminKnowledge() {
  return adminGet(XB.admin.knowledge.fetch);
}

export function fetchAdminKnowledgeCategories() {
  return adminGet(XB.admin.knowledge.getCategory);
}

export function createAdminKnowledge(body) {
  return adminPost(XB.admin.knowledge.item, body);
}

export function updateAdminKnowledge(body) {
  return adminSend(XB.admin.knowledge.item, 'put', body);
}

export function deleteAdminKnowledge(id) {
  return adminSend(XB.admin.knowledge.item, 'delete', { id });
}

export function showAdminKnowledge(id, show) {
  return adminPost(XB.admin.knowledge.show, { id, show });
}

export function sortAdminKnowledge(ids) {
  return adminPost(XB.admin.knowledge.sort, { ids });
}
