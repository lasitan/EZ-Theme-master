const TRANSPORT = ['vmess', 'vless', 'trojan'];
const HYSTERIA = ['hysteria', 'hysteria2', 'tuic'];

export const NETWORKS = [
  { value: 'tcp', label: 'TCP' },
  { value: 'ws', label: 'Websocket' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'h2', label: 'HTTP/2' },
  { value: 'httpupgrade', label: 'HttpUpgrade' },
  { value: 'xhttp', label: 'XHTTP' },
  { value: 'kcp', label: 'mKCP' },
  { value: 'quic', label: 'QUIC' }
];

export const TLS_OPTIONS = [
  { value: '0', label: '关闭' },
  { value: '1', label: 'TLS' },
  { value: '2', label: 'Reality' }
];

export const CIPHERS = [
  'aes-128-gcm',
  'aes-192-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
  '2022-blake3-chacha20-poly1305'
];

export const FLOWS = [
  { value: '', label: '无' },
  { value: 'xtls-rprx-vision', label: 'Vision' },
  { value: 'xtls-rprx-direct', label: 'Direct' },
  { value: 'xtls-rprx-splice', label: 'Splice' }
];

export function normalizeType(raw) {
  const value = String(raw || 'vmess').toLowerCase().trim();
  if (value === 'v2ray') return 'vmess';
  if (value === 'hysteria2') return 'hysteria';
  return value;
}

export function usesTransport(type) {
  return TRANSPORT.includes(normalizeType(type));
}

export function usesHysteria(type) {
  return HYSTERIA.includes(normalizeType(type));
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function readProtocol(raw) {
  if (asObject(raw) === raw && raw) return { ...raw };
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return asObject(parsed);
    } catch (e) {
      return {};
    }
  }
  return {};
}

function headerHost(settings) {
  const headers = asObject(settings.headers);
  return headers.Host || headers.host || '';
}

function tlsValue(settings) {
  const tls = settings.tls;
  if (tls === 2 || tls === '2' || tls === 'reality' || asObject(settings.reality_settings).public_key) return '2';
  if (tls === 1 || tls === true || tls === '1' || tls === 'tls') return '1';
  return '0';
}

export function emptyProtocolForm() {
  return {
    cipher: 'aes-128-gcm',
    password: '',
    plugin: '',
    pluginOpts: '',
    network: 'ws',
    path: '/',
    hostHeader: '',
    flow: '',
    tls: '1',
    serverName: '',
    allowInsecure: false,
    publicKey: '',
    privateKey: '',
    shortId: '',
    dest: '',
    upMbps: '',
    downMbps: '',
    obfs: '',
    obfsPassword: ''
  };
}

const KNOWN = [
  'cipher', 'password', 'server_password', 'plugin', 'plugin_opts', 'network', 'network_settings',
  'tls', 'tls_settings', 'reality_settings', 'flow', 'up_mbps', 'down_mbps', 'obfs', 'obfs_password', 'version'
];

export function splitProtocol(raw) {
  const settings = readProtocol(raw);
  const form = emptyProtocolForm();
  const networkSettings = asObject(settings.network_settings);
  const tlsSettings = asObject(settings.tls_settings);
  const reality = Object.keys(asObject(settings.reality_settings)).length ? asObject(settings.reality_settings) : tlsSettings;
  form.cipher = String(settings.cipher || form.cipher);
  form.password = String(settings.password || settings.server_password || '');
  form.plugin = String(settings.plugin || '');
  form.pluginOpts = String(settings.plugin_opts || '');
  form.network = String(settings.network || 'ws');
  form.path = String(networkSettings.path || '/');
  form.hostHeader = String(headerHost(networkSettings) || '');
  form.flow = String(settings.flow || '');
  form.tls = tlsValue(settings);
  form.serverName = String(tlsSettings.server_name || reality.server_name || '');
  form.allowInsecure = tlsSettings.allow_insecure === true || tlsSettings.allow_insecure === 1;
  form.publicKey = String(reality.public_key || '');
  form.privateKey = String(reality.private_key || '');
  form.shortId = String(reality.short_id || '');
  form.dest = String(reality.dest || reality.server_name || '');
  form.upMbps = settings.up_mbps == null ? '' : String(settings.up_mbps);
  form.downMbps = settings.down_mbps == null ? '' : String(settings.down_mbps);
  form.obfs = String(settings.obfs || '');
  form.obfsPassword = String(settings.obfs_password || '');
  const extra = {};
  Object.keys(settings).forEach((key) => {
    if (!KNOWN.includes(key)) extra[key] = settings[key];
  });
  return { form, extra };
}

export function buildProtocol(form, type, extra = {}) {
  const body = { ...extra };
  const kind = normalizeType(type);
  if (kind === 'shadowsocks') {
    body.cipher = form.cipher;
    body.password = form.password;
    body.plugin = form.plugin;
    body.plugin_opts = form.pluginOpts;
    return body;
  }
  if (usesTransport(kind)) {
    body.network = form.network || 'tcp';
    body.network_settings = {
      path: form.path || '/',
      headers: { Host: form.hostHeader || form.serverName || '' }
    };
    body.tls = Number(form.tls || 0);
    body.tls_settings = {
      server_name: form.serverName,
      allow_insecure: !!form.allowInsecure
    };
    if (kind === 'vless') body.flow = form.flow || '';
    if (form.tls === '2') {
      body.reality_settings = {
        server_name: form.dest || form.serverName,
        public_key: form.publicKey,
        private_key: form.privateKey,
        short_id: form.shortId,
        dest: form.dest
      };
    }
    return body;
  }
  if (usesHysteria(kind)) {
    body.version = kind === 'tuic' ? undefined : 2;
    if (form.upMbps !== '') body.up_mbps = Number(form.upMbps);
    if (form.downMbps !== '') body.down_mbps = Number(form.downMbps);
    body.obfs = form.obfs;
    body.obfs_password = form.obfsPassword;
    body.tls_settings = {
      server_name: form.serverName,
      allow_insecure: !!form.allowInsecure
    };
    if (body.version == null) delete body.version;
    return body;
  }
  body.password = form.password;
  return body;
}

export function metaFieldList(meta, type) {
  const protocols = meta && Array.isArray(meta.protocols) ? meta.protocols : [];
  const found = protocols.find((item) => normalizeType(item && item.type) === normalizeType(type));
  const fields = found && Array.isArray(found.fields) ? found.fields : [];
  return fields.map((item, index) => {
    if (typeof item === 'string') return { key: item, label: item, kind: 'text', options: [], tip: '' };
    const key = String(item.key || item.name || item.field || `field_${index}`);
    const rawType = String(item.type || item.component || '').toLowerCase();
    const options = Array.isArray(item.options) ? item.options : [];
    let kind = 'text';
    if (rawType.includes('bool') || rawType === 'switch') kind = 'bool';
    else if (rawType.includes('select') || options.length) kind = 'select';
    else if (rawType.includes('area') || item.multiline) kind = 'text';
    return {
      key,
      label: String(item.label || item.title || key),
      kind,
      options: options.map((option) => {
        if (option && typeof option === 'object') {
          return { value: String(option.value ?? option.id ?? ''), label: String(option.label || option.name || option.value || '') };
        }
        return { value: String(option), label: String(option) };
      }),
      tip: String(item.tip || item.help || item.description || '')
    };
  }).filter((item) => item.key);
}

export function typeChoices(meta) {
  const fromMeta = meta && Array.isArray(meta.types) ? meta.types : [];
  const base = fromMeta.length ? fromMeta : ['vmess', 'vless', 'trojan', 'shadowsocks', 'hysteria', 'tuic', 'socks', 'http', 'naive'];
  const labels = {};
  (meta && Array.isArray(meta.protocols) ? meta.protocols : []).forEach((item) => {
    if (item && item.type) labels[normalizeType(item.type)] = item.label || item.type;
  });
  const seen = new Set();
  return base.map((item) => normalizeType(item)).filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  }).map((value) => ({ value, label: labels[value] || value }));
}
