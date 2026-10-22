import { XB } from '../endpoints';
import { adminGet, adminPost, listBody } from './http';

export function fetchAdminTickets({ status = 0, level, filter = [], sort = [] } = {}) {
  const params = { status };
  if (level !== '' && level != null) params.level = level;
  const body = listBody(filter, sort);
  if (level !== '' && level != null) body.level = level;
  return adminPost(`${XB.admin.ticket.fetch}?${new URLSearchParams(params).toString()}`, body);
}

export function fetchAdminTicketDetail(id) {
  return adminGet(XB.admin.ticket.fetch, { id });
}

export function replyAdminTicket(id, message) {
  return adminPost(XB.admin.ticket.reply, { id, message });
}

export function closeAdminTicket(id) {
  return adminPost(XB.admin.ticket.close, { id });
}
