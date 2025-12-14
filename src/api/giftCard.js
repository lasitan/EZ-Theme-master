import request from './request';

export function checkGiftCard(code) {
  return request({
    url: '/user/gift-card/check',
    method: 'post',
    data: { code }
  });
}

export function redeemGiftCard(code) {
  return request({
    url: '/user/gift-card/redeem',
    method: 'post',
    data: { code }
  });
}

export function getGiftCardHistory(params) {
  return request({
    url: '/user/gift-card/history',
    method: 'get',
    params
  });
}

export function getGiftCardDetail(params) {
  return request({
    url: '/user/gift-card/detail',
    method: 'get',
    params
  });
}

export function getGiftCardTypes() {
  return request({
    url: '/user/gift-card/types',
    method: 'get'
  });
}