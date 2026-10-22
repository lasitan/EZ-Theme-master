import request from '../request';

export const ADMIN_FETCH_SIZE = 10000;

export function extractRows(payload) {
  const root = payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  if (Array.isArray(root)) return root;
  if (root && typeof root === 'object') {
    const keys = ['data', 'list', 'rows', 'items', 'records', 'logs', 'templates', 'codes', 'usages', 'discovered'];
    for (const key of keys) {
      if (Array.isArray(root[key])) return root[key];
    }
  }
  return [];
}

export function extractData(payload) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) return payload.data;
  return payload;
}

export function assertBiz(payload) {
  if (!payload || typeof payload !== 'object' || payload instanceof Blob) return payload;
  if (payload.status === 'fail' || payload.status === 'error' || payload.success === false) {
    throw new Error(payload.message || '请求失败');
  }
  return payload;
}

export function adminErrorMessage(error, fallback = '请求失败') {
  const data = error && error.response && error.response.data;
  if (data && typeof data === 'object' && data.message) return data.message;
  if (error && error.response && error.response.message) return error.response.message;
  if (error && error.message) return error.message;
  return fallback;
}

export function adminRequest(config) {
  return request(config).then((res) => {
    if (config.responseType === 'blob') return res;
    return assertBiz(res);
  });
}

export function adminGet(url, params) {
  return adminRequest({ url, method: 'get', params });
}

export function adminSend(url, method, data) {
  return adminRequest({ url, method, data, json: true });
}

export function adminPost(url, data) {
  return adminSend(url, 'post', data);
}

export function listBody(filter = [], sort = [], pageSize = ADMIN_FETCH_SIZE) {
  return { current: 1, pageSize, filter, sort };
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function saveBlobOrThrow(blob, filename) {
  if (blob && typeof blob.text === 'function' && blob.type && blob.type.includes('json')) {
    const text = await blob.text();
    let message = '导出失败';
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.message) message = parsed.message;
    } catch (e) {
      if (text) message = text;
    }
    throw new Error(message);
  }
  saveBlob(blob, filename);
}
