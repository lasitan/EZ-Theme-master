import axios from 'axios';

import request from './request';
import { XB } from './endpoints';

export function getUserInfo() {
  return request({
    url: XB.user.info,
    method: 'get'
  });
}

export function getIpLocationInfo() {
  const headers = {
    'Accept': 'application/json'
  };

  const normalize = (raw) => {
    const d = raw && raw.data ? raw.data : raw;
    if (!d || typeof d !== 'object') return { data: {} };

    return {
      data: {
        ip: d.ip || d.query || '',
        country: d.country || d.country_name || '',
        region: d.region || d.regionName || d.region_name || '',
        city: d.city || ''
      }
    };
  };

  const tryGet = async (url) => {
    const res = await axios.get(url, {
      timeout: 8000,
      headers
    });
    return normalize(res);
  };

  const urls = [
    'https://ipwho.is/',
    'https://ipapi.co/json/',
    'https://api.ip.sb/geoip',
    'https://ipwhois.app/json/'
  ];

  return (async () => {
    let lastError;
    for (const url of urls) {
      try {
        const normalized = await tryGet(url);
        if (normalized && normalized.data && normalized.data.ip) {
          return normalized;
        }
      } catch (e) {
        lastError = e;
      }
    }
    return Promise.reject(lastError || new Error('Failed to fetch IP location info'));
  })();
}

export function changePassword(data) {
  return request({
    url: XB.user.changePassword,
    method: 'post',
    data
  });
}

export function resetSecurity() {
  return request({
    url: XB.user.resetSecurity,
    method: 'get'
  });
}

export function updateRemindSettings(data) {
  return request({
    url: XB.user.update,
    method: 'post',
    data
  });
}

export function getActiveSession() {
  return request({
    url: XB.user.getActiveSession,
    method: 'get'
  });
}

export function removeActiveSession(sessionId) {
  return request({
    url: XB.user.removeActiveSession,
    method: 'post',
    data: {
      session_id: sessionId
    }
  });
}

export function getCommConfig() {
  return request({
    url: XB.user.commConfig,
    method: 'get'
  });
}

export function getTelegramBotInfo() {
  return request({
    url: XB.user.telegramBotInfo,
    method: 'get'
  });
}

export function getUserSubscribe() {
  return request({
    url: XB.user.getSubscribe,
    method: 'get'
  });
}

export function getQuickLoginUrl(redirect) {
  return request({
    url: XB.user.getQuickLoginUrl,
    method: 'post',
    data: redirect ? { redirect } : {}
  });
} 
