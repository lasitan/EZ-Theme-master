import request from './request';
import { XB } from './endpoints';

export function checkGiftCard(code) {
  return request({
    url: XB.user.giftCard.check,
    method: 'post',
    data: { code }
  });
}

export function redeemGiftCard(code) {
  return request({
    url: XB.user.giftCard.redeem,
    method: 'post',
    data: { code }
  });
}

export function getGiftCardHistory(params) {
  return request({
    url: XB.user.giftCard.history,
    method: 'get',
    params
  });
}

export function getGiftCardDetail(params) {
  return request({
    url: XB.user.giftCard.detail,
    method: 'get',
    params
  });
}

export function getGiftCardTypes() {
  return request({
    url: XB.user.giftCard.types,
    method: 'get'
  });
}
