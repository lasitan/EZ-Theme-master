import request from './request';
import { XB } from './endpoints';

export function fetchKnowledgeList(language) {
  return request({
    url: XB.user.knowledgeFetch,
    method: 'get',
    params: { language }
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    throw new Error('Invalid response format');
  }).catch(error => {
    console.error('Error fetching knowledge list:', error);
    throw error;
  });
}

export function fetchKnowledgeDetail(id, language) {
  return request({
    url: XB.user.knowledgeFetch,
    method: 'get',
    params: { id, language }
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    throw new Error('Invalid response format');
  }).catch(error => {
    console.error('Error fetching knowledge detail:', error);
    throw error;
  });
}

export function fetchKnowledgeCategories() {
  return request({
    url: XB.user.knowledgeCategory,
    method: 'get'
  });
}
