import request from './request';
import { XB } from './endpoints';

export function getTrafficLog() {
  return request({
    url: XB.user.trafficLog,
    method: 'get'
  });
}
