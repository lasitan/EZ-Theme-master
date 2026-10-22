import { XB } from '../endpoints';
import { adminGet, adminPost } from './http';

export const CONFIG_MODULES = [
  { id: 'site', fetchKey: 'site', write: XB.admin.config.site, dataKey: 'site' },
  { id: 'safe', fetchKey: 'safe', write: XB.admin.config.safe, dataKey: 'safe' },
  { id: 'subscribe', fetchKey: 'subscribe', write: XB.admin.config.subscribe, dataKey: 'subscribe' },
  { id: 'invite', fetchKey: 'invite', write: XB.admin.config.invite, dataKey: 'invite' },
  { id: 'server', fetchKey: 'server', write: XB.admin.config.server, dataKey: 'server' },
  { id: 'mail', fetchKey: 'mail', write: XB.admin.config.mail, dataKey: 'mail' },
  { id: 'subscribe_template', fetchKey: 'subscribe_template', write: XB.admin.config.subscribeTemplate, dataKey: 'subscribe_template' }
];

export function fetchConfigModule(fetchKey) {
  return adminGet(XB.admin.config.fetch, { key: fetchKey });
}

export function saveConfigModule(writePath, patch) {
  return adminPost(writePath, patch);
}

export function testSendMail(email) {
  return adminPost(XB.admin.config.testSendMail, { email });
}
