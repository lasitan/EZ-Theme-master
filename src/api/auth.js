
import request from './request';
import store from '@/store';
import { SITE_CONFIG } from '@/utils/baseConfig';
import { getApiBaseUrl } from '@/utils/baseConfig';
import { XB } from './endpoints';

/** 将 JWT 格式化为 Authorization 请求头 */
export const formatBearerToken = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  return /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
};

/** 从 token / auth_data 中提取裸 JWT */
export const extractJwtValue = (value) => {
  if (!value) return '';
  return String(value).trim().replace(/^Bearer\s+/i, '');
};

/** 解析登录响应：以 data.token（JWT）为主，兼容旧版 auth_data */
export const resolveLoginAuth = (responseData) => {
  const tokenField = responseData?.token;
  const authField = responseData?.auth_data;
  const jwt = extractJwtValue(tokenField || authField);
  const authorization = formatBearerToken(authField || tokenField);
  return { jwt, authorization };
};

const persistAdminFlag = (isAdmin) => {
  if (isAdmin === true || isAdmin === 1 || isAdmin === '1') {
    localStorage.setItem('is_admin', '1');
  } else {
    localStorage.removeItem('is_admin');
  }
};

const redirectToLoginOnExpired = () => {
  const currentRoute = window.location.pathname;
  const isAuthPage = /\/(login|register|forgot-password)/.test(currentRoute);
  if (!isAuthPage) {
    try {
      const { createLoginObfToken, LOGIN_OBF_TTL_MS } = require('../utils/loginObf');
      const obf = createLoginObfToken(LOGIN_OBF_TTL_MS);
      window.location.href = `/#/login/${obf}`;
    } catch (e) {
      window.location.href = '/#/login';
    }
  }
};

const setCookie = (name, value, days) => {
  const siteName = SITE_CONFIG.siteName;
  
  const cookieValue = JSON.stringify({
    site: siteName,
    value: value
  });
  
  const isSecure = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  const domain = isLocalhost ? '' : `domain=${window.location.hostname};`;
  let cookieString = `${name}=${encodeURIComponent(cookieValue)}; ${expires}; ${domain} path=/`;
  
  if (isSecure) {
    cookieString += '; secure';
  }
  
  cookieString += '; SameSite=Lax';
  
  document.cookie = cookieString;
  
  try {
    localStorage.setItem(`cookie_${name}`, cookieValue);
  } catch (err) {
  }
  
  setTimeout(() => {
    const checkCookie = getCookie(name);
    const success = !!checkCookie;
    
    if (!success) {
      document.cookie = `${name}=${encodeURIComponent(cookieValue)}; ${expires}; path=/`;
      localStorage.setItem(`cookie_${name}_failure`, 'true');
      window.authCookieFailure = true;
    }
  }, 300);
};


const getCookie = (name) => {
  const siteName = SITE_CONFIG.siteName;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  let cookieValue = null;
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        const rawValue = c.substring(nameEQ.length, c.length);
        const decodedValue = decodeURIComponent(rawValue);
        const parsedValue = JSON.parse(decodedValue);
        
        if (parsedValue && parsedValue.site === siteName) {
          cookieValue = parsedValue.value;
          break;
        }
      } catch (err) {
        console.error('Cookie 解析失败:', err);
      }
    }
  }
  
  if (!cookieValue) {
    try {
      const localValue = localStorage.getItem(`cookie_${name}`);
      if (localValue) {
        try {
          const parsedValue = JSON.parse(localValue);
          if (parsedValue && parsedValue.site === siteName) {
            cookieValue = parsedValue.value;
          }
        } catch (err) {
          console.error('LocalStorage cookie 解析失败:', err);
        }
      }
    } catch (err) {
    }
  }
  
  if (!cookieValue && name === 'auth_data' && window.authDataInStorage) {
    cookieValue = window.authDataInStorage;
  }
  
  return cookieValue;
};


const deleteCookie = (name) => {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  try {
    localStorage.removeItem(`cookie_${name}`);
    localStorage.removeItem(`cookie_${name}_failure`);
  } catch (err) {
  }
  
  setTimeout(() => {
    const checkCookie = getCookie(name);
    if (checkCookie) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const domain = isLocalhost ? '' : `domain=${window.location.hostname};`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${domain} path=/`;
    }
  }, 100);
};


export const handleLoginSuccess = (responseData, rememberMe) => {
  try {
    window.isUserLoggedIn = undefined;
    window.authCookieFailure = false;
    window.authDataInStorage = null;

    const { jwt, authorization } = resolveLoginAuth(responseData);
    if (!jwt) {
      return { success: false, error: '登录数据不完整' };
    }

    store.dispatch('login', jwt);
    localStorage.setItem('token', jwt);
    localStorage.setItem('auth_data', authorization);
    persistAdminFlag(responseData.is_admin);

    const days = rememberMe ? 30 : 1;
    setCookie('auth_data', authorization, days);
    window.authDataInStorage = authorization;
    window.isUserLoggedIn = true;

    setTimeout(() => {
      Promise.resolve().then(function() { return import('@/i18n'); })
        .then(({ reloadMessages }) => {
          reloadMessages().catch(() => {});
        }).catch(() => {});
    }, 500);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


export const login = async (loginData) => {
  const { rememberMe, ...requestData } = loginData;
  
  const response = await request({
    url: XB.passport.login,
    method: 'post',
    data: requestData
  });
  
  let responseData = response;
  if ((response && response.data) || (response && typeof response === 'object' && Object.prototype.hasOwnProperty.call(response, 'data'))) {
    responseData = response.data;
  }
  
  if (!responseData || !responseData.token) {
    throw new Error('登录数据不完整');
  }

  const handledResponse = handleLoginSuccess(responseData, rememberMe);

  if (handledResponse.success) {
    const { jwt, authorization } = resolveLoginAuth(responseData);
    return {
      success: true,
      token: jwt,
      auth_data: authorization,
      is_admin: responseData.is_admin
    };
  } else {
    throw new Error(handledResponse.error);
  }
};


export function register(data) {
  return request({
    url: XB.passport.register,
    method: 'post',
    data
  }).then(response => {
    let responseData = response.data || response;

    if (responseData.token) {
      handleLoginSuccess(responseData, false);
    }

    console.log('注册成功，准备重新加载语言文件');
    setTimeout(async () => {
      try {
        const i18nModule = await import('@/i18n');
        const result = await i18nModule.reloadMessages();
        console.log('注册后重新加载语言包结果:', result);
        
        window.dispatchEvent(new CustomEvent('languageChanged'));
      } catch (error) {
        console.error('注册后重载语言包失败:', error);
      }
    }, 100);
    
    return response;
  });
}


export function resetPassword(data) {
  return request({
    url: XB.passport.forget,
    method: 'post',
    data
  });
}


export function getUserInfo() {
  return request({
    url: XB.user.info,
    method: 'get'
  });
}


export const logout = async () => {
  try {
    _clearAllAuthData();
    
    return new Promise(resolve => {
      setTimeout(() => {
        Promise.resolve().then(function() { return import('@/i18n'); })
          .then(({ reloadMessages }) => {
            reloadMessages().then(() => {
              resolve({
                success: true,
                redirectToLogin: true,
                redirectUrl: '/login?logout=true'
              });
            }).catch(() => {
              resolve({
                success: true, 
                redirectToLogin: true,
                redirectUrl: '/login?logout=true'
              });
            });
          }).catch(() => {
            resolve({
              success: true,
              redirectToLogin: true,
              redirectUrl: '/login?logout=true'
            });
          });
      }, 200);
    });
  } catch (error) {
    return {
      success: false,
      error: error.message,
      redirectToLogin: true,
      redirectUrl: '/login?logout=true'
    };
  }
};


export function getWebsiteConfig() {
  return request({
    url: XB.guest.commConfig,
    method: 'get'
  });
}


export function sendEmailVerify(data) {
  return request({
    url: XB.passport.sendEmailVerify,
    method: 'post',
    data
  });
}


export const checkLoginStatus = () => {
  const now = Date.now();
  if (window._lastLoginCheck && (now - window._lastLoginCheckTime < 1000)) {
    return window._lastLoginCheck;
  }
  
  if (window._isLoggingOut === true) {
    _cacheLoginStatus(false);
    return false;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('logout') === 'true') {
    _clearAllAuthData();
    _cacheLoginStatus(false);
    return false;
  }
  
  if (window.isUserLoggedIn === false) {
    _cacheLoginStatus(false);
    return false;
  }
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null' || token === '') {
    _clearAllAuthData();
    _cacheLoginStatus(false);
    return false;
  }

  let authData = localStorage.getItem('auth_data') ||
    sessionStorage.getItem('auth_data') ||
    window.authDataInStorage;

  if (!authData || authData === 'undefined' || authData === 'null' || authData === '') {
    authData = formatBearerToken(token);
    localStorage.setItem('auth_data', authData);
  }

  window.isUserLoggedIn = true;
  _cacheLoginStatus(true);
  return true;
};


const _cacheLoginStatus = (status) => {
  window._lastLoginCheck = status;
  window._lastLoginCheckTime = Date.now();
};


const _clearAllAuthData = () => {
  window.isUserLoggedIn = false;
  window.authDataInStorage = null;
  window.authCookieFailure = false;
  
  const authKeys = [
    'token', 
    'auth_data', 
    'cookie_auth_data', 
    'userInfo', 
    'is_admin',
    'vuex',
    'user',
    'auth'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  const sessionKeys = [
    'token', 
    'auth_data',
    'vuex',
    'user',
    'auth'
  ];
  
  sessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  const cookiePaths = ['/', '/dashboard', '/user', '/admin'];
  const cookieNames = ['auth_data', 'XSRF-TOKEN', 'laravel_session', 'token'];
  
  cookieNames.forEach(name => {
    cookiePaths.forEach(path => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    });
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    deleteCookie(name);
  });
  
  try {
    if (store && typeof store.commit === 'function') {
      store.commit('CLEAR_USER');
    }
  } catch (e) {
    console.error('Vuex状态清除失败', e);
  }
};


export const forceLogout = () => {
  window.isUserLoggedIn = false;
  window.authDataInStorage = null;
  window.authCookieFailure = false;
  
  const authKeys = [
    'token', 
    'auth_data', 
    'cookie_auth_data', 
    'userInfo', 
    'is_admin',
    'vuex',
    'user',
    'auth'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  const sessionKeys = [
    'token', 
    'auth_data',
    'vuex',
    'user',
    'auth'
  ];
  
  sessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  const cookiePaths = ['/', '/dashboard', '/user', '/admin'];
  const cookieNames = ['auth_data', 'XSRF-TOKEN', 'laravel_session', 'token'];
  
  cookieNames.forEach(name => {
    cookiePaths.forEach(path => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    });
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    deleteCookie(name);
  });
  
  try {
    if (store && typeof store.commit === 'function') {
      store.commit('CLEAR_USER');
    }
  } catch (e) {
    console.error('Vuex状态清除失败', e);
  }
};


export const tokenLogin = (verifyToken, redirect) => {
  return request({
    url: XB.passport.token2Login,
    method: 'get',
    params: { 
      verify: verifyToken,
      redirect: redirect || '' 
    }
  });
};

export const loginWithMailLink = (email) => {
  return request({
    url: XB.passport.loginWithMailLink,
    method: 'post',
    data: { email }
  });
};


export const getGoogleLoginRedirectUrl = (redirect) => {
  const base = String(getApiBaseUrl() || '').replace(/\/+$/, '');
  const path = '/passport/auth/google/login';
  const url = `${base}${path}`;
  const qp = new URLSearchParams();
  if (redirect) qp.set('redirect', redirect);
  const qs = qp.toString();
  return qs ? `${url}?${qs}` : url;
};


/** 通过 /user/info 校验 JWT 是否仍有效（不再调用已废弃的 checkLogin） */
export const verifyAuthSession = async () => {
  if (!checkLoginStatus()) {
    return { isLoggedIn: false };
  }

  try {
    await request({
      url: XB.user.info,
      method: 'get'
    });
    window.isUserLoggedIn = true;
    return { isLoggedIn: true };
  } catch (error) {
    console.error('校验登录状态失败:', error);

    const msg = error.response?.data?.message || error.message || '';
    const isExpired = error.response?.status === 401 ||
      msg.includes('未登录') ||
      msg.includes('登陆已过期');

    if (isExpired) {
      forceLogout();
      redirectToLoginOnExpired();
      return { isLoggedIn: false, message: '登录已过期，请重新登录' };
    }

    return { isLoggedIn: null, error: msg || '网络错误' };
  }
};

/** @deprecated 请使用 verifyAuthSession */
export const checkUserLoginStatus = verifyAuthSession; 
