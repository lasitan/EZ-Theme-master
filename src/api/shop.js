import request from './request';
import { XB } from './endpoints';

export function fetchPlans() {
  return request({
    url: XB.user.planFetch,
    method: 'get'
  });
}

export function fetchGuestPlans() {
  return request({
    url: XB.guest.planFetch,
    method: 'get'
  });
}

export function getCommConfig() {
  return request({
    url: XB.user.commConfig,
    method: 'get'
  });
}

export function fetchPlanById(id) {
  return request({
    url: XB.user.planFetch,
    method: 'get',
    params: { id }
  });
}

export function verifyCoupon(code, planId) {
  return request({
    url: XB.user.couponCheck,
    method: 'post',
    data: {
      code,
      plan_id: planId
    }
  });
}

export function submitOrder(data) {
  return request({
    url: XB.user.order.save,
    method: 'post',
    data
  });
}

export function getOrderDetail(tradeNo) {
  return request({
    url: XB.user.order.detail,
    method: 'get',
    params: { trade_no: tradeNo }
  });
}

export function getPaymentMethods() {
  return request({
    url: XB.user.order.getPaymentMethod,
    method: 'get'
  });
}

export function checkOrderStatus(tradeNo) {
  return request({
    url: XB.user.order.check,
    method: 'get',
    params: { trade_no: tradeNo }
  });
}

export function cancelOrder(tradeNo) {
  return request({
    url: XB.user.order.cancel,
    method: 'post',
    data: {
      trade_no: tradeNo
    }
  });
}

export function checkoutOrder(tradeNo, methodId) {
  return request({
    url: XB.user.order.checkout,
    method: 'post',
    data: {
      trade_no: tradeNo,
      method: methodId
    }
  });
}

export function getStripePublicKey() {
  return request({
    url: XB.user.stripePublicKey,
    method: 'post'
  });
}
