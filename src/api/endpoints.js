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
  },
  admin: {
    typeFetch: '/admin/type/fetch',
    stat: {
      getStats: '/admin/stat/getStats',
      getOrder: '/admin/stat/getOrder',
      getTrafficRank: '/admin/stat/getTrafficRank',
      types: '/admin/stat/types'
    },
    system: {
      getSystemStatus: '/admin/system/getSystemStatus',
      getSystemLog: '/admin/system/getSystemLog',
      getLogClearStats: '/admin/system/getLogClearStats',
      clearSystemLog: '/admin/system/clearSystemLog'
    },
    user: {
      fetch: '/admin/user/fetch',
      update: '/admin/user/update',
      setInviteUser: '/admin/user/setInviteUser',
      ban: '/admin/user/ban',
      resetSecret: '/admin/user/resetSecret',
      destroy: '/admin/user/destroy',
      generate: '/admin/user/generate',
      sendMail: '/admin/user/sendMail',
      dumpCSV: '/admin/user/dumpCSV',
      getUserInfoById: '/admin/user/getUserInfoById',
      trafficLog: '/admin/user/trafficLog',
      types: '/admin/user/types'
    },
    order: {
      fetch: '/admin/order/fetch',
      detail: '/admin/order/detail',
      commission: '/admin/order/commission',
      paid: '/admin/order/paid',
      cancel: '/admin/order/cancel',
      update: '/admin/order/update',
      create: '/admin/order/create',
      types: '/admin/order/types'
    },
    plan: {
      fetch: '/admin/plan/fetch',
      save: '/admin/plan/save',
      update: '/admin/plan/update',
      drop: '/admin/plan/drop',
      sort: '/admin/plan/sort'
    },
    server: {
      getNodes: '/admin/server/manage/getNodes',
      getProtocolMeta: '/admin/server/manage/getProtocolMeta',
      save: '/admin/server/manage/save',
      update: '/admin/server/manage/update',
      copy: '/admin/server/manage/copy',
      drop: '/admin/server/manage/drop',
      groupFetch: '/admin/server/group/fetch',
      routeFetch: '/admin/server/route/fetch',
      types: '/admin/server/types'
    },
    notice: {
      fetch: '/admin/notice/fetch',
      item: '/admin/notice',
      show: '/admin/notice/show',
      sort: '/admin/notice/sort'
    },
    ticket: {
      fetch: '/admin/ticket/fetch',
      reply: '/admin/ticket/reply',
      close: '/admin/ticket/close'
    },
    coupon: {
      fetch: '/admin/coupon/fetch',
      generate: '/admin/coupon/generate',
      update: '/admin/coupon/update',
      show: '/admin/coupon/show',
      drop: '/admin/coupon/drop',
      types: '/admin/coupon/types'
    },
    giftCard: {
      templates: '/admin/gift-card/templates',
      createTemplate: '/admin/gift-card/create-template',
      updateTemplate: '/admin/gift-card/update-template',
      deleteTemplate: '/admin/gift-card/delete-template',
      codes: '/admin/gift-card/codes',
      generateCodes: '/admin/gift-card/generate-codes',
      updateCode: '/admin/gift-card/update-code',
      toggleCode: '/admin/gift-card/toggle-code',
      deleteCode: '/admin/gift-card/delete-code',
      exportCodes: '/admin/gift-card/export-codes',
      usages: '/admin/gift-card/usages',
      statistics: '/admin/gift-card/statistics',
      types: '/admin/gift-card/types'
    },
    knowledge: {
      fetch: '/admin/knowledge/fetch',
      getCategory: '/admin/knowledge/getCategory',
      item: '/admin/knowledge',
      show: '/admin/knowledge/show',
      sort: '/admin/knowledge/sort'
    },
    config: {
      fetch: '/admin/config/fetch',
      site: '/admin/config/site',
      safe: '/admin/config/safe',
      subscribe: '/admin/config/subscribe',
      invite: '/admin/config/invite',
      server: '/admin/config/server',
      mail: '/admin/config/mail',
      subscribeTemplate: '/admin/config/subscribe-template',
      testSendMail: '/admin/config/testSendMail'
    },
    payment: {
      fetch: '/admin/payment/fetch',
      getPaymentMethods: '/admin/payment/getPaymentMethods',
      getPaymentForm: '/admin/payment/getPaymentForm',
      save: '/admin/payment/save',
      show: '/admin/payment/show',
      drop: '/admin/payment/drop',
      sort: '/admin/payment/sort'
    },
    plugin: {
      getPlugins: '/admin/plugin/getPlugins',
      types: '/admin/plugin/types',
      discover: '/admin/plugin/discover',
      scan: '/admin/plugin/scan',
      config: '/admin/plugin/config',
      enable: '/admin/plugin/enable',
      disable: '/admin/plugin/disable',
      delete: '/admin/plugin/delete',
      reload: '/admin/plugin/reload',
      install: '/admin/plugin/install',
      upload: '/admin/plugin/upload'
    },
    trafficReset: {
      logs: '/admin/traffic-reset/logs',
      resetUser: '/admin/traffic-reset/reset-user'
    }
  }
};
