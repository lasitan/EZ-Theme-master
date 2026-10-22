import { XB } from '../endpoints';
import { adminGet, adminPost, adminRequest } from './http';

export function fetchPlugins() {
  return adminGet(XB.admin.plugin.getPlugins);
}

export function fetchPluginTypes() {
  return adminGet(XB.admin.plugin.types);
}

export function discoverPlugins() {
  return adminGet(XB.admin.plugin.discover);
}

export function scanPlugins() {
  return adminPost(XB.admin.plugin.scan, {});
}

export function fetchPluginConfig(params) {
  return adminGet(XB.admin.plugin.config, params);
}

export function savePluginConfig(body) {
  return adminPost(XB.admin.plugin.config, body);
}

export function enablePlugin(body) {
  return adminPost(XB.admin.plugin.enable, body);
}

export function disablePlugin(body) {
  return adminPost(XB.admin.plugin.disable, body);
}

export function deletePlugin(body) {
  return adminPost(XB.admin.plugin.delete, body);
}

export function reloadPlugins() {
  return adminPost(XB.admin.plugin.reload, {});
}

export function installPlugin(body) {
  return adminPost(XB.admin.plugin.install, body);
}

export function uploadPluginFolder(files, { overwrite = false, autoEnable = false } = {}) {
  const form = new FormData();
  form.append('overwrite', overwrite ? 'true' : 'false');
  form.append('auto_enable', autoEnable ? 'true' : 'false');
  files.forEach((file) => {
    form.append('file', file, file.webkitRelativePath || file.name);
  });
  return adminRequest({
    url: XB.admin.plugin.upload,
    method: 'post',
    data: form
  });
}
