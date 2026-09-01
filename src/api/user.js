import axios from 'axios';

import request from './request';

export function getUserInfo() {
  return request({
    url: '/user/info',
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
    url: '/user/changePassword',
    method: 'post',
    data
  });
}


export function resetSecurity() {
  return request({
    url: '/user/resetSecurity',
    method: 'get'
  });
}


export function updateRemindSettings(data) {
  return request({
    url: '/user/update',
    method: 'post',
    data
  });
}


export function getActiveSession() {
  return request({
    url: '/user/getActiveSession',
    method: 'get'
  });
}


export function getCommConfig() {
  return request({
    url: '/user/comm/config',
    method: 'get'
  });
}


export function getTelegramBotInfo() {
  return request({
    url: '/user/telegram/getBotInfo',
    method: 'get'
  });
}


export function getUserSubscribe() {
  return request({
    url: '/user/getSubscribe',
    method: 'get'
  });
} 
