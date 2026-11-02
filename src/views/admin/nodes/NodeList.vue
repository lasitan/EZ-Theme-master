<template>
  <div>
    <div class="toolbar">
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
    </div>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button" type="button" @click="toggle(row)">{{ flagOn(row.show) ? t('admin.hide') : t('admin.show') }}</button>
        <button class="action-button" type="button" @click="copyNode(row)">{{ t('admin.nodes.copy') }}</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>

    <AdminDialog :show="open" :title="form.id ? t('admin.edit') : t('admin.create')" wide @close="open = false">
      <div class="filter-grid">
        <div class="form-group">
          <label class="form-label">类型</label>
          <select v-model="form.type" class="form-control" @change="onTypeChange">
            <option v-for="item in typeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">名称</label><input v-model="form.name" class="form-control" /></div>
        <div class="form-group">
          <label class="form-label">标识 <InfoTip text="留空时按数字编号。" /></label>
          <input v-model="form.code" class="form-control" />
        </div>
        <div class="form-group"><label class="form-label">地址</label><input v-model="form.host" class="form-control" /></div>
        <div class="form-group">
          <label class="form-label">连接端口 <InfoTip text="单个端口，或范围如 1000-2000。" /></label>
          <input v-model="form.port" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">服务端口 <InfoTip text="机器上实际监听的端口。" /></label>
          <input v-model="form.server_port" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">倍率 <InfoTip text="流量按这个倍数计算。" /></label>
          <input v-model="form.rate" class="form-control" />
        </div>
        <div class="form-group"><label class="form-label">排序</label><input v-model="form.sort" class="form-control" /></div>
        <div class="form-group">
          <label class="form-label">机器</label>
          <select v-model="form.machine_id" class="form-control">
            <option value="">不指定</option>
            <option v-for="item in machines" :key="item.id" :value="String(item.id)">{{ item.name || item.id }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">权限组</label>
          <select v-model="form.group_ids" class="form-control" multiple>
            <option v-for="item in groups" :key="item.id" :value="String(item.id)">{{ item.name || item.id }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">路由</label>
          <select v-model="form.route_ids" class="form-control" multiple>
            <option v-for="item in routes" :key="item.id" :value="String(item.id)">{{ item.remarks || item.name || item.id }}</option>
          </select>
        </div>
      </div>

      <template v-if="schemaFields.length">
        <div class="section-label">协议</div>
        <div class="filter-grid">
          <div v-for="field in schemaFields" :key="field.key" class="form-group">
            <label class="form-label">{{ field.label }} <InfoTip v-if="field.tip" :text="field.tip" /></label>
            <label v-if="field.kind === 'bool'" class="check-line"><input v-model="schemaValues[field.key]" type="checkbox" /></label>
            <select v-else-if="field.kind === 'select'" v-model="schemaValues[field.key]" class="form-control">
              <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <input v-else v-model="schemaValues[field.key]" class="form-control" />
          </div>
        </div>
      </template>
      <template v-else>
        <div class="section-label">协议</div>
        <div v-if="isShadowsocks" class="filter-grid">
          <div class="form-group">
            <label class="form-label">加密</label>
            <select v-model="protocol.cipher" class="form-control">
              <option v-for="item in CIPHERS" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">密码</label><input v-model="protocol.password" class="form-control" /></div>
          <div class="form-group"><label class="form-label">插件</label><input v-model="protocol.plugin" class="form-control" /></div>
          <div class="form-group"><label class="form-label">插件参数</label><input v-model="protocol.pluginOpts" class="form-control" /></div>
        </div>
        <div v-else-if="isTransport" class="filter-grid">
          <div class="form-group">
            <label class="form-label">传输</label>
            <select v-model="protocol.network" class="form-control">
              <option v-for="item in NETWORKS" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">路径</label><input v-model="protocol.path" class="form-control" /></div>
          <div class="form-group"><label class="form-label">伪装域名</label><input v-model="protocol.hostHeader" class="form-control" /></div>
          <div class="form-group">
            <label class="form-label">安全</label>
            <select v-model="protocol.tls" class="form-control">
              <option v-for="item in TLS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">证书域名</label><input v-model="protocol.serverName" class="form-control" /></div>
          <div v-if="form.type === 'vless'" class="form-group">
            <label class="form-label">流控</label>
            <select v-model="protocol.flow" class="form-control">
              <option v-for="item in FLOWS" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div v-if="protocol.tls === '2'" class="form-group"><label class="form-label">公钥</label><input v-model="protocol.publicKey" class="form-control" /></div>
          <div v-if="protocol.tls === '2'" class="form-group"><label class="form-label">私钥</label><input v-model="protocol.privateKey" class="form-control" /></div>
          <div v-if="protocol.tls === '2'" class="form-group"><label class="form-label">Short ID</label><input v-model="protocol.shortId" class="form-control" /></div>
          <div v-if="protocol.tls === '2'" class="form-group"><label class="form-label">伪装目标</label><input v-model="protocol.dest" class="form-control" /></div>
        </div>
        <div v-else-if="isHysteria" class="filter-grid">
          <div class="form-group"><label class="form-label">上行 Mbps</label><input v-model="protocol.upMbps" class="form-control" /></div>
          <div class="form-group"><label class="form-label">下行 Mbps</label><input v-model="protocol.downMbps" class="form-control" /></div>
          <div class="form-group"><label class="form-label">混淆</label><input v-model="protocol.obfs" class="form-control" /></div>
          <div class="form-group"><label class="form-label">混淆密码</label><input v-model="protocol.obfsPassword" class="form-control" /></div>
          <div class="form-group"><label class="form-label">证书域名</label><input v-model="protocol.serverName" class="form-control" /></div>
        </div>
        <div v-else class="filter-grid">
          <div class="form-group"><label class="form-label">密码</label><input v-model="protocol.password" class="form-control" /></div>
        </div>
        <label v-if="isTransport || isHysteria" class="check-line"><input v-model="protocol.allowInsecure" type="checkbox" /> 允许不安全证书</label>
      </template>

      <div v-if="extraDraft && extraDraft.fields && extraDraft.fields.length" class="form-group">
        <div class="section-label">其他</div>
        <RecordFields :draft="extraDraft" />
      </div>
      <button v-if="isTransport" class="action-button" type="button" @click="makeEch">生成 ECH</button>
      <label class="check-line"><input v-model="form.show" type="checkbox" /> {{ t('admin.show') }}</label>
      <label class="check-line"><input v-model="form.enabled" type="checkbox" /> {{ t('admin.enable') }}</label>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="open = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="submit">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>

    <AdminDialog :show="!!pending" :title="t('admin.confirmTitle')" @close="pending = null">
      <p>{{ pending && pending.text }}</p>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="pending = null">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="runPending">{{ t('admin.confirm') }}</button>
      </template>
    </AdminDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import InfoTip from '@/components/admin/InfoTip.vue';
import RecordFields from '@/components/admin/RecordFields.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractData, extractRows } from '@/api/admin/http';
import { copyAdminNode, dropAdminNode, fetchAdminNodes, fetchMachines, fetchProtocolMeta, fetchServerGroups, fetchServerRoutes, generateEchKey, saveAdminNode, updateAdminNode } from '@/api/admin/server';
import { flagOn } from '@/utils/adminFormat';
import { fromDraft, toDraft } from '@/utils/recordFields';
import { CIPHERS, FLOWS, NETWORKS, TLS_OPTIONS, buildProtocol, emptyProtocolForm, metaFieldList, splitProtocol, typeChoices, usesHysteria, usesTransport } from '@/utils/nodeProtocolForm';

const { t } = useI18n();
const { showToast } = useToast();
const rows = ref([]);
const groups = ref([]);
const routes = ref([]);
const machines = ref([]);
const meta = ref(null);
const open = ref(false);
const pending = ref(null);
const schemaFields = ref([]);
const schemaValues = reactive({});
const extraDraft = ref(null);
const form = reactive(emptyForm());
const protocol = reactive(emptyProtocolForm());

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '名称' },
  { key: 'type', label: '类型' },
  { key: 'host', label: '地址' },
  { key: 'port', label: '端口' },
  { key: 'show', label: '显示', format: (row) => (flagOn(row.show) ? '是' : '否') }
];

const typeOptions = computed(() => typeChoices(meta.value));
const isTransport = computed(() => usesTransport(form.type));
const isHysteria = computed(() => usesHysteria(form.type));
const isShadowsocks = computed(() => form.type === 'shadowsocks');

function emptyForm() {
  return {
    id: null, type: 'vmess', code: '', name: '', host: '', port: '443', server_port: '443',
    rate: '1', sort: '0', machine_id: '', group_ids: [], route_ids: [], show: true, enabled: true
  };
}

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
function idList(value) { return Array.isArray(value) ? value.map((item) => String(item)) : []; }

function applyProtocol(raw) {
  const fields = metaFieldList(meta.value, form.type);
  schemaFields.value = fields;
  Object.keys(schemaValues).forEach((key) => delete schemaValues[key]);
  if (fields.length) {
    const source = raw && typeof raw === 'object' ? raw : {};
    fields.forEach((field) => {
      const current = source[field.key];
      schemaValues[field.key] = field.kind === 'bool' ? flagOn(current) : (current == null ? '' : String(current));
    });
    const extra = { ...source };
    fields.forEach((field) => delete extra[field.key]);
    extraDraft.value = toDraft(extra);
    return;
  }
  const split = splitProtocol(raw);
  Object.assign(protocol, split.form);
  extraDraft.value = toDraft(split.extra);
}

function onTypeChange() {
  if (!form.id) applyProtocol({});
}

function protocolPayload() {
  if (schemaFields.value.length) {
    const body = fromDraft(extraDraft.value);
    schemaFields.value.forEach((field) => {
      if (field.kind === 'bool') body[field.key] = schemaValues[field.key] ? 1 : 0;
      else body[field.key] = schemaValues[field.key];
    });
    return body;
  }
  return buildProtocol(protocol, form.type, fromDraft(extraDraft.value));
}

function payload() {
  const body = {
    type: form.type,
    code: form.code.trim(),
    name: form.name.trim(),
    host: form.host.trim(),
    port: form.port.trim(),
    server_port: form.server_port === '' ? 0 : Number(form.server_port),
    rate: Number(form.rate),
    tags: [],
    group_ids: form.group_ids.map(Number).filter((n) => Number.isFinite(n)),
    route_ids: form.route_ids.map(Number).filter((n) => Number.isFinite(n)),
    protocol_settings: protocolPayload(),
    show: form.show ? 1 : 0,
    enabled: form.enabled ? 1 : 0,
    sort: Number(form.sort) || 0,
    rate_time_enable: 0,
    parent_id: null
  };
  if (form.machine_id) body.machine_id = Number(form.machine_id);
  if (form.id) body.id = form.id;
  return body;
}

async function load() {
  const [nodeRes, groupRes, routeRes, machineRes] = await Promise.all([
    fetchAdminNodes(), fetchServerGroups(), fetchServerRoutes(), fetchMachines().catch(() => [])
  ]);
  rows.value = extractRows(nodeRes);
  groups.value = extractRows(groupRes);
  routes.value = extractRows(routeRes);
  machines.value = extractRows(machineRes);
  try { meta.value = extractData(await fetchProtocolMeta()) || {}; } catch (e) { meta.value = {}; }
}

function openCreate() {
  Object.assign(form, emptyForm());
  if (typeOptions.value[0]) form.type = typeOptions.value[0].value;
  applyProtocol({});
  open.value = true;
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    type: row.type || 'vmess',
    code: row.code || '',
    name: row.name || '',
    host: row.host || '',
    port: row.port == null ? '' : String(row.port),
    server_port: row.server_port == null ? '' : String(row.server_port),
    rate: row.rate == null ? '1' : String(row.rate),
    sort: String(row.sort ?? 0),
    machine_id: row.machine_id == null ? '' : String(row.machine_id),
    group_ids: idList(row.group_ids),
    route_ids: idList(row.route_ids),
    show: flagOn(row.show),
    enabled: row.enabled == null ? true : flagOn(row.enabled)
  });
  applyProtocol(row.protocol_settings || {});
  open.value = true;
}

async function submit() {
  try {
    const body = payload();
    if (form.id) await updateAdminNode(body);
    else await saveAdminNode(body);
    open.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

async function toggle(row) {
  try {
    await updateAdminNode({
      id: row.id,
      type: row.type,
      code: row.code,
      name: row.name,
      host: row.host,
      port: row.port,
      server_port: row.server_port ?? 0,
      rate: Number(row.rate || 1),
      tags: Array.isArray(row.tags) ? row.tags : [],
      group_ids: Array.isArray(row.group_ids) ? row.group_ids : [],
      route_ids: Array.isArray(row.route_ids) ? row.route_ids : [],
      protocol_settings: row.protocol_settings || {},
      show: flagOn(row.show) ? 0 : 1,
      enabled: row.enabled == null || flagOn(row.enabled) ? 1 : 0,
      sort: Number(row.sort) || 0
    });
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

async function copyNode(row) {
  try { await copyAdminNode(row.id); showToast(t('admin.saved'), 'success'); await load(); } catch (e) { fail(e); }
}

function remove(row) {
  pending.value = {
    text: `删除节点「${row.name}」？`,
    run: async () => {
      try { await dropAdminNode(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); }
    }
  };
}

async function runPending() {
  const job = pending.value;
  pending.value = null;
  if (job) await job.run();
}

async function makeEch() {
  try {
    const data = extractData(await generateEchKey({ type: form.type })) || {};
    const extra = fromDraft(extraDraft.value);
    Object.assign(extra, data);
    extraDraft.value = toDraft(extra);
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}

onMounted(async () => {
  try { await load(); } catch (e) { fail(e); }
});
</script>
