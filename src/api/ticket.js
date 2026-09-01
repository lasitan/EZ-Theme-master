import request from './request';
import { XB } from './endpoints';

export function fetchTicketList() {
  return request({
    url: XB.user.ticket.fetch,
    method: 'get'
  });
}

export function createTicket(data) {
  return request({
    url: XB.user.ticket.save,
    method: 'post',
    data
  });
}

export function getTicketDetail(id) {
  return request({
    url: XB.user.ticket.fetch,
    method: 'get',
    params: { id }
  });
}

export function replyTicket(id, message) {
  return request({
    url: XB.user.ticket.reply,
    method: 'post',
    data: {
      id,
      message
    }
  });
}

export function closeTicket(id) {
  return request({
    url: XB.user.ticket.close,
    method: 'post',
    data: {
      id
    }
  });
}
