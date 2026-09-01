/**
 * 外部配置文件
 * 全部站点配置从 .env 的 VUE_APP_* 读取
 * logo 摆放位置为 images/logo.png
 */

const env = (key, fallback = '') => {
    const value = process.env[key];
    return (value === undefined || value === '') ? fallback : value;
};

const envBool = (key, fallback = false) => {
    const value = process.env[key];
    if (value === undefined || value === '') return fallback;
    return value === 'true' || value === '1';
};

const envNum = (key, fallback = 0) => {
    const value = process.env[key];
    if (value === undefined || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const envList = (key, fallback = []) => {
    const value = process.env[key];
    if (!value) return fallback;
    return value.split(',').map((item) => item.trim()).filter(Boolean);
};

const envNumList = (key, fallback = []) => {
    const parsed = envList(key, fallback.map(String)).map((item) => Number(item));
    return parsed.filter((item) => Number.isFinite(item));
};

const envJson = (key, fallback) => {
    const value = process.env[key];
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error(`解析环境变量 ${key} 失败:`, error);
        return fallback;
    }
};

const siteName = env('VUE_APP_SITE_NAME', '黑心云|府');
const groupChatUrl = env('VUE_APP_GROUP_CHAT_URL', 'https://t.me/heixinyun_chat');

const defaultCustomCards = [
    {
        id: 'telegram',
        title: 'Telegram',
        description: '加入我们的Telegram频道',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-brand-telegram" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" /></svg>',
        url: groupChatUrl,
        openInNewTab: true
    }
];

export const config = {
    SITE_CONFIG: {
        siteName,
        siteDescription: env('VUE_APP_SITE_DESCRIPTION', siteName),
        copyright: `© ${new Date().getFullYear()} ${siteName}. All Rights Reserved.`,
        showLogo: envBool('VUE_APP_SHOW_LOGO', true),
        landingText: {
            'zh-CN': env('VUE_APP_LANDING_TEXT_ZH_CN', '世界那么大，我想云游一下'),
            'vi-VN': env('VUE_APP_LANDING_TEXT_VI_VN', 'Thế giới thật rộng lớn, tôi muốn du ngoạn trên mây'),
            'en-US': env('VUE_APP_LANDING_TEXT_EN_US', 'The world is vast, I want to roam the cloud'),
            'zh-TW': env('VUE_APP_LANDING_TEXT_ZH_TW', '世界那麼大，我想雲遊一下'),
            'ja-JP': env('VUE_APP_LANDING_TEXT_JA_JP', '世界はとても広い、クラウドを旅したい'),
            'ko-KR': env('VUE_APP_LANDING_TEXT_KO_KR', '세상은 이렇게 넓다, 클라우드를 유람하고 싶다'),
            'ru-RU': env('VUE_APP_LANDING_TEXT_RU_RU', 'Мир так велик, хочу странствовать по облакам'),
            'fa-IR': env('VUE_APP_LANDING_TEXT_FA_IR', 'دنیا بسیار بزرگ است، می‌خواهم در ابرها گردش کنم')
        },
        customLandingPage: env('VUE_APP_CUSTOM_LANDING_PAGE', '')
    },

    DEFAULT_CONFIG: {
        defaultLanguage: env('VUE_APP_DEFAULT_LANGUAGE', 'zh-CN'),
        defaultTheme: env('VUE_APP_DEFAULT_THEME', 'light'),
        primaryColor: env('VUE_APP_PRIMARY_COLOR', '#355cc2'),
        enableLandingPage: envBool('VUE_APP_ENABLE_LANDING_PAGE', true)
    },

    AUTH_CONFIG: {
        autoAgreeTerms: envBool('VUE_APP_AUTH_AUTO_AGREE_TERMS', true),
        verificationCode: {
            showCheckSpamTip: envBool('VUE_APP_AUTH_SHOW_CHECK_SPAM_TIP', true),
            checkSpamTipDelay: envNum('VUE_APP_AUTH_CHECK_SPAM_TIP_DELAY', 1000)
        },
        popup: {
            enabled: envBool('VUE_APP_AUTH_POPUP_ENABLED', false),
            title: env('VUE_APP_AUTH_POPUP_TITLE', '用户须知 (可自定义开启)'),
            content: env('VUE_APP_AUTH_POPUP_CONTENT', '<p><strong>欢迎使用我们的服务！</strong></p><p>请注意以下事项：</p><ul><li>请妥善保管您的账号信息</li><li>如有问题请联系客服</li></ul>'),
            cooldownHours: envNum('VUE_APP_AUTH_POPUP_COOLDOWN_HOURS', 0),
            closeWaitSeconds: envNum('VUE_APP_AUTH_POPUP_CLOSE_WAIT_SECONDS', 3)
        }
    },

    AUTH_LAYOUT_CONFIG: {
        layoutType: env('VUE_APP_AUTH_LAYOUT_TYPE', 'split'),
        splitLayout: {
            leftContent: {
                backgroundImage: env('VUE_APP_AUTH_SPLIT_BG_IMAGE', 'https://www.loliapi.com/acg'),
                siteName: {
                    show: envBool('VUE_APP_AUTH_SPLIT_SITE_NAME_SHOW', true),
                    color: env('VUE_APP_AUTH_SPLIT_SITE_NAME_COLOR', 'white')
                },
                greeting: {
                    show: envBool('VUE_APP_AUTH_SPLIT_GREETING_SHOW', true),
                    color: env('VUE_APP_AUTH_SPLIT_GREETING_COLOR', 'white')
                }
            }
        }
    },

    SHOP_CONFIG: {
        showHotSaleBadge: envBool('VUE_APP_SHOP_SHOW_HOT_SALE_BADGE', false),
        showPlanFeatureCards: envBool('VUE_APP_SHOP_SHOW_PLAN_FEATURE_CARDS', true),
        autoSelectMaxPeriod: envBool('VUE_APP_SHOP_AUTO_SELECT_MAX_PERIOD', false),
        hidePeriodTabs: envBool('VUE_APP_SHOP_HIDE_PERIOD_TABS', false),
        lowStockThreshold: envNum('VUE_APP_SHOP_LOW_STOCK_THRESHOLD', 5),
        recommendedPlanIndices: envNumList('VUE_APP_SHOP_RECOMMENDED_PLAN_INDICES', [3]),
        recommendedBadgeText: env('VUE_APP_SHOP_RECOMMENDED_BADGE_TEXT', '推荐购买'),
        enableDiscountCalculation: envBool('VUE_APP_SHOP_ENABLE_DISCOUNT_CALCULATION', false),
        periodOrder: envList('VUE_APP_SHOP_PERIOD_ORDER', [
            'three_year_price',
            'two_year_price',
            'year_price',
            'half_year_price',
            'quarter_price',
            'month_price',
            'onetime_price'
        ]),
        popup: {
            enabled: envBool('VUE_APP_SHOP_POPUP_ENABLED', false),
            title: env('VUE_APP_SHOP_POPUP_TITLE', '用户须知'),
            content: env('VUE_APP_SHOP_POPUP_CONTENT', '<p><strong>常规套餐默认每月订单日重置流量，您当月未用使用完的流量，不会累积到下个月</strong></p>'),
            cooldownHours: envNum('VUE_APP_SHOP_POPUP_COOLDOWN_HOURS', 0),
            closeWaitSeconds: envNum('VUE_APP_SHOP_POPUP_CLOSE_WAIT_SECONDS', 0)
        }
    },

    ORDER_CONFIG: {
        confirmOrder: envBool('VUE_APP_ORDER_CONFIRM', true),
        confirmOrderContent: env('VUE_APP_ORDER_CONFIRM_CONTENT', '<p><strong style=\'color: red\'>无法提供相关教程和使用说明。</strong></p><p><strong style=\'color: red\'>不会使用请勿购买，没有退款政策</strong></p>')
    },

    DASHBOARD_CONFIG: {
        showUserEmail: envBool('VUE_APP_DASHBOARD_SHOW_USER_EMAIL', false),
        importButtonHighlightBtnbgcolor: envBool('VUE_APP_DASHBOARD_IMPORT_HIGHLIGHT', false),
        enableResetTraffic: envBool('VUE_APP_DASHBOARD_ENABLE_RESET_TRAFFIC', true),
        resetTrafficDisplayMode: env('VUE_APP_DASHBOARD_RESET_TRAFFIC_MODE', 'low'),
        lowTrafficThreshold: envNum('VUE_APP_DASHBOARD_LOW_TRAFFIC_THRESHOLD', 10),
        enableRenewPlan: envBool('VUE_APP_DASHBOARD_ENABLE_RENEW_PLAN', true),
        renewPlanDisplayMode: env('VUE_APP_DASHBOARD_RENEW_PLAN_MODE', 'always'),
        expiringThreshold: envNum('VUE_APP_DASHBOARD_EXPIRING_THRESHOLD', 7),
        showImportSubscription: envBool('VUE_APP_DASHBOARD_SHOW_IMPORT_SUBSCRIPTION', true),
        groupChatUrl
    },

    CLIENT_CONFIG: {
        showDownloadCard: envBool('VUE_APP_CLIENT_SHOW_DOWNLOAD_CARD', true),
        showIOS: envBool('VUE_APP_CLIENT_SHOW_IOS', true),
        showAndroid: envBool('VUE_APP_CLIENT_SHOW_ANDROID', true),
        showMacOS: envBool('VUE_APP_CLIENT_SHOW_MACOS', true),
        showWindows: envBool('VUE_APP_CLIENT_SHOW_WINDOWS', true),
        showLinux: envBool('VUE_APP_CLIENT_SHOW_LINUX', true),
        showOpenWrt: envBool('VUE_APP_CLIENT_SHOW_OPENWRT', true),
        clientLinks: {
            ios: env('VUE_APP_CLIENT_LINK_IOS', 'https://apps.apple.com/us/app/hiddify-proxy-vpn/id6596777532'),
            android: env('VUE_APP_CLIENT_LINK_ANDROID', 'https://github.com/chen08209/FlClash/releases'),
            macos: env('VUE_APP_CLIENT_LINK_MACOS', 'https://github.com/chen08209/FlClash/releases'),
            windows: env('VUE_APP_CLIENT_LINK_WINDOWS', 'https://github.com/clash-verge-rev/clash-verge-rev/releases'),
            linux: env('VUE_APP_CLIENT_LINK_LINUX', 'https://github.com/clash-verge-rev/clash-verge-rev/releases'),
            openwrt: env('VUE_APP_CLIENT_LINK_OPENWRT', 'https://github.com/vernesong/OpenClash/releases')
        },
        showShadowrocket: envBool('VUE_APP_CLIENT_SHOW_SHADOWROCKET', true),
        showSurge: envBool('VUE_APP_CLIENT_SHOW_SURGE', true),
        showStash: envBool('VUE_APP_CLIENT_SHOW_STASH', true),
        showQuantumultX: envBool('VUE_APP_CLIENT_SHOW_QUANTUMULTX', true),
        showHiddifyIOS: envBool('VUE_APP_CLIENT_SHOW_HIDDIFY_IOS', true),
        showSingboxIOS: envBool('VUE_APP_CLIENT_SHOW_SINGBOX_IOS', true),
        showLoon: envBool('VUE_APP_CLIENT_SHOW_LOON', true),
        showFlClashAndroid: envBool('VUE_APP_CLIENT_SHOW_FLCLASH_ANDROID', true),
        showV2rayNG: envBool('VUE_APP_CLIENT_SHOW_V2RAYNG', true),
        showClashAndroid: envBool('VUE_APP_CLIENT_SHOW_CLASH_ANDROID', true),
        showSurfboard: envBool('VUE_APP_CLIENT_SHOW_SURFBOARD', true),
        showClashMetaAndroid: envBool('VUE_APP_CLIENT_SHOW_CLASHMETA_ANDROID', true),
        showNekobox: envBool('VUE_APP_CLIENT_SHOW_NEKOBOX', true),
        showSingboxAndroid: envBool('VUE_APP_CLIENT_SHOW_SINGBOX_ANDROID', true),
        showHiddifyAndroid: envBool('VUE_APP_CLIENT_SHOW_HIDDIFY_ANDROID', true),
        showFlClashWindows: envBool('VUE_APP_CLIENT_SHOW_FLCLASH_WINDOWS', true),
        showClashVergeWindows: envBool('VUE_APP_CLIENT_SHOW_CLASHVERGE_WINDOWS', true),
        showClashWindows: envBool('VUE_APP_CLIENT_SHOW_CLASH_WINDOWS', true),
        showNekoray: envBool('VUE_APP_CLIENT_SHOW_NEKORAY', true),
        showSingboxWindows: envBool('VUE_APP_CLIENT_SHOW_SINGBOX_WINDOWS', true),
        showHiddifyWindows: envBool('VUE_APP_CLIENT_SHOW_HIDDIFY_WINDOWS', true),
        showFlClashMac: envBool('VUE_APP_CLIENT_SHOW_FLCLASH_MAC', true),
        showClashVergeMac: envBool('VUE_APP_CLIENT_SHOW_CLASHVERGE_MAC', true),
        showClashX: envBool('VUE_APP_CLIENT_SHOW_CLASHX', true),
        showClashMetaX: envBool('VUE_APP_CLIENT_SHOW_CLASHMETAX', true),
        showSurgeMac: envBool('VUE_APP_CLIENT_SHOW_SURGE_MAC', true),
        showStashMac: envBool('VUE_APP_CLIENT_SHOW_STASH_MAC', true),
        showQuantumultXMac: envBool('VUE_APP_CLIENT_SHOW_QUANTUMULTX_MAC', true),
        showSingboxMac: envBool('VUE_APP_CLIENT_SHOW_SINGBOX_MAC', true),
        showHiddifyMac: envBool('VUE_APP_CLIENT_SHOW_HIDDIFY_MAC', true)
    },

    PROFILE_CONFIG: {
        showGiftCardRedeem: envBool('VUE_APP_PROFILE_SHOW_GIFT_CARD_REDEEM', true),
        showRecentDevices: envBool('VUE_APP_PROFILE_SHOW_RECENT_DEVICES', true)
    },

    SECURITY_CONFIG: {
        enableAntiDebugging: envBool('VUE_APP_ENABLE_ANTI_DEBUGGING', false),
        enableFrontendDomainCheck: envBool('VUE_APP_ENABLE_FRONTEND_DOMAIN_CHECK', false),
        enableLicenseCheck: envBool('VUE_APP_ENABLE_LICENSE_CHECK', true)
    },

    AUTHORIZED_DOMAINS: envList('VUE_APP_AUTHORIZED_DOMAINS', ['heixin.pp.ua']),

    CAPTCHA_CONFIG: {
        captchaType: env('VUE_APP_CAPTCHA_TYPE', 'cloudflare'),
        google: {
            verifyUrl: env('VUE_APP_CAPTCHA_GOOGLE_VERIFY_URL', 'https://www.google.com/recaptcha/api/siteverify')
        },
        cloudflare: {
            verifyUrl: env('VUE_APP_CAPTCHA_CLOUDFLARE_VERIFY_URL', 'https://challenges.cloudflare.com/turnstile/v0/siteverify')
        }
    },

    CUSTOM_HEADERS: {
        enabled: envBool('VUE_APP_CUSTOM_HEADERS_ENABLED', false),
        headers: envJson('VUE_APP_CUSTOM_HEADERS_JSON', {})
    },

    PAYMENT_CONFIG: {
        openPaymentInNewTab: envBool('VUE_APP_PAYMENT_OPEN_IN_NEW_TAB', true),
        qrcodeSize: envNum('VUE_APP_PAYMENT_QRCODE_SIZE', 200),
        qrcodeColor: env('VUE_APP_PAYMENT_QRCODE_COLOR', '#000000'),
        qrcodeBackground: env('VUE_APP_PAYMENT_QRCODE_BACKGROUND', '#ffffff'),
        autoCheckPayment: envBool('VUE_APP_PAYMENT_AUTO_CHECK', true),
        autoCheckInterval: envNum('VUE_APP_PAYMENT_AUTO_CHECK_INTERVAL', 5000),
        autoCheckMaxTimes: envNum('VUE_APP_PAYMENT_AUTO_CHECK_MAX_TIMES', 60),
        useSafariPaymentModal: envBool('VUE_APP_PAYMENT_SAFARI_MODAL', true),
        autoSelectFirstMethod: envBool('VUE_APP_PAYMENT_AUTO_SELECT_FIRST', true)
    },

    INVITE_CONFIG: {
        showCommissionBadge: envBool('VUE_APP_INVITE_SHOW_COMMISSION_BADGE', false),
        recordsPerPage: envNum('VUE_APP_INVITE_RECORDS_PER_PAGE', 10),
        inviteLinkConfig: {
            linkMode: env('VUE_APP_INVITE_LINK_MODE', 'auto'),
            customDomain: env('VUE_APP_INVITE_CUSTOM_DOMAIN', 'https://example.com')
        }
    },

    BROWSER_RESTRICT_CONFIG: {
        enabled: envBool('VUE_APP_BROWSER_RESTRICT_ENABLED', true),
        restrictBrowsers: {
            '360': envBool('VUE_APP_RESTRICT_BROWSER_360', true),
            'QQ': envBool('VUE_APP_RESTRICT_BROWSER_QQ', true),
            'WeChat': envBool('VUE_APP_RESTRICT_BROWSER_WECHAT', true),
            'Baidu': envBool('VUE_APP_RESTRICT_BROWSER_BAIDU', true),
            'Sogou': envBool('VUE_APP_RESTRICT_BROWSER_SOGOU', true),
            'UC': envBool('VUE_APP_RESTRICT_BROWSER_UC', false),
            'Maxthon': envBool('VUE_APP_RESTRICT_BROWSER_MAXTHON', false)
        },
        recommendedBrowsers: {
            'Chrome': env('VUE_APP_RECOMMENDED_BROWSER_CHROME', 'https://www.google.cn/chrome/'),
            'Edge': env('VUE_APP_RECOMMENDED_BROWSER_EDGE', 'https://www.microsoft.com/edge')
        }
    },

    TICKET_CONFIG: {
        includeUserInfoInTicket: envBool('VUE_APP_TICKET_INCLUDE_USER_INFO', true),
        popup: {
            enabled: envBool('VUE_APP_TICKET_POPUP_ENABLED', true),
            title: env('VUE_APP_TICKET_POPUP_TITLE', '工单须知'),
            content: env('VUE_APP_TICKET_POPUP_CONTENT', '<p>请您准确描述您的问题，再提交工单，以便我们更快帮助您。</p>'),
            cooldownHours: envNum('VUE_APP_TICKET_POPUP_COOLDOWN_HOURS', 24),
            closeWaitSeconds: envNum('VUE_APP_TICKET_POPUP_CLOSE_WAIT_SECONDS', 0)
        }
    },

    TRAFFICLOG_CONFIG: {
        enableTrafficLog: envBool('VUE_APP_TRAFFICLOG_ENABLED', true),
        daysToShow: envNum('VUE_APP_TRAFFICLOG_DAYS_TO_SHOW', 30),
        sumDailyTraffic: envBool('VUE_APP_TRAFFICLOG_SUM_DAILY', false)
    },

    NODES_CONFIG: {
        showNodeRate: envBool('VUE_APP_NODES_SHOW_RATE', true),
        showNodeDetails: envBool('VUE_APP_NODES_SHOW_DETAILS', false),
        allowViewNodeInfo: envBool('VUE_APP_NODES_ALLOW_VIEW_INFO', true)
    },

    CUSTOMER_SERVICE_CONFIG: {
        enabled: envBool('VUE_APP_CS_ENABLED', false),
        type: env('VUE_APP_CS_TYPE', 'crisp'),
        customHtml: env('VUE_APP_CS_CUSTOM_HTML', ''),
        embedMode: env('VUE_APP_CS_EMBED_MODE', 'embed'),
        showWhenNotLoggedIn: envBool('VUE_APP_CS_SHOW_WHEN_NOT_LOGGED_IN', true),
        iconPosition: {
            desktop: {
                left: env('VUE_APP_CS_DESKTOP_LEFT', '20px'),
                bottom: env('VUE_APP_CS_DESKTOP_BOTTOM', '20px')
            },
            mobile: {
                right: env('VUE_APP_CS_MOBILE_RIGHT', '20px'),
                bottom: env('VUE_APP_CS_MOBILE_BOTTOM', '100px')
            }
        }
    },

    MORE_PAGE_CONFIG: {
        enableCustomCards: envBool('VUE_APP_MORE_ENABLE_CUSTOM_CARDS', false),
        customCards: envJson('VUE_APP_MORE_CUSTOM_CARDS', defaultCustomCards)
    },

    SHIELD_CONFIG: {
        enabled: envBool('VUE_APP_TURNSTILE_ENABLED', true),
        turnstileSiteKey: env('VUE_APP_TURNSTILE_SITE_KEY', ''),
        tokenTtlMs: envNum('VUE_APP_TURNSTILE_TOKEN_TTL_MS', 3 * 60 * 60 * 1000)
    }
};

window.EZ_CONFIG = config
