import { XB } from '../endpoints';
import { adminGet, adminPost } from './http';

export function fetchTrafficResetLogs() {
  return adminGet(XB.admin.trafficReset.logs);
}

export function resetUserTraffic(userId) {
  return adminPost(XB.admin.trafficReset.resetUser, { user_id: userId });
}
