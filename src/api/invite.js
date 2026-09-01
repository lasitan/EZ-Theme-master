import request from './request';
import { XB } from './endpoints';

export function getInviteData() {
  return request({
    url: XB.user.invite.fetch,
    method: 'get'
  });
}

export function getInviteDetails(current, pageSize) {
  return request({
    url: XB.user.invite.details,
    method: 'get',
    params: {
      current,
      page_size: pageSize
    }
  });
}

export function getCommissionConfig() {
  return request({
    url: XB.user.commConfig,
    method: 'get'
  });
}

export function generateInviteCode() {
  return request({
    url: XB.user.invite.save,
    method: 'get'
  });
}

export function transferCommission(amount) {
  return request({
    url: XB.user.transfer,
    method: 'post',
    data: {
      transfer_amount: amount
    }
  });
}

export function withdrawCommission(amount, account, method) {
  return request({
    url: XB.user.ticket.withdraw,
    method: 'post',
    data: {
      withdraw_amount: amount,
      withdraw_account: account,
      withdraw_method: method
    }
  });
}
