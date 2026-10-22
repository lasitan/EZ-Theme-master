import { XB } from '../endpoints';
import { adminGet, adminPost } from './http';

export function fetchAdminPlans() {
  return adminGet(XB.admin.plan.fetch);
}

export function saveAdminPlan(body) {
  return adminPost(XB.admin.plan.save, body);
}

export function updateAdminPlan(body) {
  return adminPost(XB.admin.plan.update, body);
}

export function dropAdminPlan(id) {
  return adminPost(XB.admin.plan.drop, { id });
}

export function sortAdminPlans(planIds) {
  return adminPost(XB.admin.plan.sort, { plan_ids: planIds });
}
