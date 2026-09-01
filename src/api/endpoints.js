/**
 * Xboard V1 用户端路径（不含 /api/v1 前缀，由 request.baseURL 拼接）
 * 依据：cedar2025/Xboard app/Http/Routes/V1/{Guest,Passport,User}Route.php
 */
export const XB = {
  guest: {
    planFetch: '/guest/plan/fetch',
    commConfig: '/guest/comm/config'
  },
  passport: {
    register: '/passport/auth/register',
    login: '/passport/auth/login',
    token2Login: '/passport/auth/token2Login',
    forget: '/passport/auth/forget',
    getQuickLoginUrl: '/passport/auth/getQuickLoginUrl',
    loginWithMailLink: '/passport/auth/loginWithMailLink',
    sendEmailVerify: '/passport/comm/sendEmailVerify',
    pv: '/passport/comm/pv'
  },
  user: {
    resetSecurity: '/user/resetSecurity',
    info: '/user/info',
    changePassword: '/user/changePassword',
    update: '/user/update',
    getSubscribe: '/user/getSubscribe',
    getStat: '/user/getStat',
    transfer: '/user/transfer',
    getQuickLoginUrl: '/user/getQuickLoginUrl',
    getActiveSession: '/user/getActiveSession',
    removeActiveSession: '/user/removeActiveSession',
    order: {
      save: '/user/order/save',
      checkout: '/user/order/checkout',
      check: '/user/order/check',
      detail: '/user/order/detail',
      fetch: '/user/order/fetch',
      getPaymentMethod: '/user/order/getPaymentMethod',
      cancel: '/user/order/cancel'
    },
    planFetch: '/user/plan/fetch',
    invite: {
      save: '/user/invite/save',
      fetch: '/user/invite/fetch',
      details: '/user/invite/details'
    },
    noticeFetch: '/user/notice/fetch',
    ticket: {
      reply: '/user/ticket/reply',
      close: '/user/ticket/close',
      save: '/user/ticket/save',
      fetch: '/user/ticket/fetch',
      withdraw: '/user/ticket/withdraw'
    },
    serverFetch: '/user/server/fetch',
    couponCheck: '/user/coupon/check',
    giftCard: {
      check: '/user/gift-card/check',
      redeem: '/user/gift-card/redeem',
      history: '/user/gift-card/history',
      detail: '/user/gift-card/detail',
      types: '/user/gift-card/types'
    },
    telegramBotInfo: '/user/telegram/getBotInfo',
    commConfig: '/user/comm/config',
    stripePublicKey: '/user/comm/getStripePublicKey',
    knowledgeFetch: '/user/knowledge/fetch',
    knowledgeCategory: '/user/knowledge/getCategory',
    trafficLog: '/user/stat/getTrafficLog'
  }
};
