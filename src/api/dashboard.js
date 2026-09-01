import request from './request';
import { XB } from './endpoints';

export function getUserInfo() {
  return request({
    url: XB.user.info,
    method: 'get'
  });
}

export function getSubscribe() {
  return request({
    url: XB.user.getSubscribe,
    method: 'get'
  });
}

export function getNotices() {
  return request({
    url: XB.user.noticeFetch,
    method: 'get'
  });
}

export function getUserStats() {
  return request({
    url: XB.user.getStat,
    method: 'get'
  });
}

export function getUserConfig() {
  return request({
    url: XB.user.commConfig,
    method: 'get'
  });
}
