import { XB } from '../endpoints';
import { adminGet, adminPost, adminRequest } from './http';

export function fetchGiftTemplates(pageSize = 10000) {
  return adminGet(XB.admin.giftCard.templates, { current: 1, pageSize });
}

export function createGiftTemplate(body) {
  return adminPost(XB.admin.giftCard.createTemplate, body);
}

export function updateGiftTemplate(body) {
  return adminPost(XB.admin.giftCard.updateTemplate, body);
}

export function deleteGiftTemplate(id) {
  return adminPost(XB.admin.giftCard.deleteTemplate, { id });
}

export function fetchGiftCodes(body) {
  return adminPost(XB.admin.giftCard.codes, body);
}

export function generateGiftCodes(body) {
  return adminPost(XB.admin.giftCard.generateCodes, body);
}

export function updateGiftCode(body) {
  return adminPost(XB.admin.giftCard.updateCode, body);
}

export function toggleGiftCode(id) {
  return adminPost(XB.admin.giftCard.toggleCode, { id });
}

export function deleteGiftCode(id) {
  return adminPost(XB.admin.giftCard.deleteCode, { id });
}

export function exportGiftCodes(filter = []) {
  return adminRequest({
    url: XB.admin.giftCard.exportCodes,
    method: 'post',
    data: { filter, limit: 500 },
    json: true,
    responseType: 'blob'
  });
}

export function fetchGiftUsages(body) {
  return adminPost(XB.admin.giftCard.usages, body);
}

export function fetchGiftStatistics() {
  return adminGet(XB.admin.giftCard.statistics);
}
