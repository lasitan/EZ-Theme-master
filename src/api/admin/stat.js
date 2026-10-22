import { XB } from '../endpoints';
import { adminGet, adminPost } from './http';

export function fetchAdminStats() {
  return adminGet(XB.admin.stat.getStats);
}

export function fetchAdminOrders(startDate, endDate) {
  return adminGet(XB.admin.stat.getOrder, { start_date: startDate, end_date: endDate });
}

export function fetchTrafficRank(type, startTime, endTime) {
  return adminGet(XB.admin.stat.getTrafficRank, {
    type,
    start_time: startTime,
    end_time: endTime
  });
}

export function fetchSystemStatus() {
  return adminGet(XB.admin.system.getSystemStatus);
}

export function fetchSystemLog(params) {
  return adminGet(XB.admin.system.getSystemLog, params);
}

export function fetchLogClearStats() {
  return adminGet(XB.admin.system.getLogClearStats);
}

export function clearSystemLog(body) {
  return adminPost(XB.admin.system.clearSystemLog, body);
}
