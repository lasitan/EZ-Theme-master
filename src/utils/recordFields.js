const LABELS = {
  server_ws_enable: '启用节点通信',
  server_ws_url: '通信地址',
  cloudflare_api_token: 'Cloudflare 令牌',
  cloudflare_account_id: 'Cloudflare 账号',
  cloudflare_dns_auto_update: '自动更新 DNS',
  agent_default_dns: '默认 DNS',
  agent_full_restart_min_uptime_sec: '整机重启最短运行时间',
  dns_hostname: 'DNS 主机名',
  dns_config: 'DNS',
  udp: 'UDP',
  tcp: 'TCP',
  doh: 'DoH',
  app_name: '站点名称',
  app_url: '站点地址',
  app_description: '站点简介',
  logo: 'Logo',
  currency: '货币',
  currency_symbol: '货币符号',
  email_host: '邮件服务器',
  email_port: '端口',
  email_username: '账号',
  email_password: '密码',
  email_encryption: '加密方式',
  email_from_address: '发件地址',
  email_from_name: '发件人',
  cipher: '加密方式',
  password: '密码',
  plugin: '插件',
  plugin_opts: '插件参数',
  network: '传输方式',
  path: '路径',
  host: '主机',
  flow: '流控',
  tls: 'TLS',
  server_name: '证书域名',
  allow_insecure: '允许不安全证书',
  public_key: '公钥',
  private_key: '私钥',
  short_id: 'Short ID',
  dest: '伪装目标',
  up_mbps: '上行 Mbps',
  down_mbps: '下行 Mbps',
  obfs: '混淆',
  obfs_password: '混淆密码',
  is_active: '启用',
  online: '在线',
  mode: '模式',
  log_level: '日志级别',
  public_ip: '公网 IP',
  agent_version: '程序版本',
  config_revision: '配置版本',
  servers_count: '节点数',
  domain: '域名',
  san: '附加域名',
  provider: '签发商',
  expires_at: '到期',
  status: '状态',
  has_cert: '已有证书',
  last_error: '最近错误',
  remarks: '备注',
  match: '匹配',
  action: '动作',
  action_value: '动作值',
  name: '名称'
};

const TIPS = {
  server_ws_enable: '打开后，机器通过 WebSocket 连接面板。',
  server_ws_url: '留空则使用面板自己的地址。',
  cloudflare_api_token: '用来自动签发证书和改 DNS。',
  agent_full_restart_min_uptime_sec: '机器至少连续运行这么多秒，才允许整机重启。',
  agent_default_dns: '新机器没单独配置 DNS 时使用。一行一个地址。',
  dns_hostname: '这台机器对外使用的域名。',
  cloudflare_dns_auto_update: '机器 IP 变化时自动改解析。'
};

const WORDS = {
  server: '节点', ws: '通信', enable: '启用', url: '地址', api: '接口', token: '令牌',
  account: '账号', dns: 'DNS', auto: '自动', update: '更新', default: '默认',
  full: '整机', restart: '重启', min: '最短', uptime: '运行', sec: '秒', host: '主机',
  name: '名称', port: '端口', password: '密码', user: '用户', email: '邮箱',
  limit: '限制', show: '显示', sort: '排序', invite: '邀请', force: '强制',
  register: '注册', captcha: '验证码', whitelist: '白名单', timeout: '超时'
};

const FLAG_KEY = /enable|enabled|show|active|allow|auto|insecure|banned|renew/i;

export function fieldLabel(key) {
  const name = String(key);
  if (LABELS[name]) return LABELS[name];
  const words = name.split('_').filter(Boolean).map((part) => WORDS[part] || part);
  return words.join('') || name;
}

export function fieldTip(key) {
  return TIPS[key] || '';
}

function isFlag(key, value) {
  if (typeof value === 'boolean') return true;
  if (value !== 0 && value !== 1 && value !== '0' && value !== '1') return false;
  return FLAG_KEY.test(String(key));
}

function isPrimitiveList(list) {
  return list.every((item) => item == null || ['string', 'number', 'boolean'].includes(typeof item));
}

export function toDraft(value, key = '', options = {}) {
  if (Array.isArray(value)) {
    if (isPrimitiveList(value)) {
      return { kind: 'lines', text: value.map((item) => (item == null ? '' : String(item))).join('\n') };
    }
    return {
      kind: 'list',
      items: value.map((item, index) => ({
        title: `${fieldLabel(key) || '项目'} ${index + 1}`,
        draft: toDraft(item, '', options)
      }))
    };
  }
  if (value && typeof value === 'object') {
    return {
      kind: 'object',
      fields: Object.keys(value).map((child) => ({
        key: child,
        label: fieldLabel(child),
        tip: fieldTip(child),
        draft: toDraft(value[child], child, options)
      }))
    };
  }
  if (isFlag(key, value)) {
    return { kind: 'bool', value: value === true || value === 1 || value === '1', asNumber: typeof value !== 'boolean' };
  }
  if (options.yml && typeof value === 'string') {
    return { kind: 'yml', value };
  }
  return {
    kind: 'text',
    value: value == null ? '' : String(value),
    numeric: typeof value === 'number'
  };
}

export function fromDraft(draft) {
  if (!draft) return '';
  if (draft.kind === 'bool') {
    if (draft.asNumber) return draft.value ? 1 : 0;
    return !!draft.value;
  }
  if (draft.kind === 'lines') {
    return String(draft.text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }
  if (draft.kind === 'list') {
    return (draft.items || []).map((item) => fromDraft(item.draft));
  }
  if (draft.kind === 'object') {
    const body = {};
    (draft.fields || []).forEach((field) => {
      body[field.key] = fromDraft(field.draft);
    });
    return body;
  }
  const text = draft.value == null ? '' : String(draft.value);
  if (draft.numeric && text.trim() !== '' && /^-?\d+(\.\d+)?$/.test(text.trim())) return Number(text.trim());
  return text;
}

export function readableRows(value, prefix = '') {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) {
    if (isPrimitiveList(value)) {
      return [{ label: prefix || '内容', value: value.map((item) => String(item)).join('、') || '—' }];
    }
    return value.flatMap((item, index) => readableRows(item, `${prefix || '项目'} ${index + 1}`));
  }
  if (typeof value === 'object') {
    return Object.keys(value).flatMap((key) => {
      const label = prefix ? `${prefix} / ${fieldLabel(key)}` : fieldLabel(key);
      const child = value[key];
      if (child && typeof child === 'object') return readableRows(child, label);
      return [{ label, value: child == null || child === '' ? '—' : String(child) }];
    });
  }
  return [{ label: prefix || '内容', value: String(value) }];
}

export function briefObject(value) {
  const rows = readableRows(value).slice(0, 3);
  if (!rows.length) return '—';
  return rows.map((row) => `${row.label} ${row.value}`).join('，');
}
