import request from './request';
import { XB } from './endpoints';

export function fetchServerNodes() {
  return request({
    url: XB.user.serverFetch,
    method: 'get'
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    throw new Error('Invalid response format');
  }).catch(error => {
    console.error('Error fetching server nodes:', error);
    throw error;
  });
}
