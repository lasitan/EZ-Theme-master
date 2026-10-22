<template>
  <AdminFrame :title="t('admin.nodes.title')" :description="t('admin.nodes.description')" :loading="loading" :error="error" @retry="load">
    <template #tools>
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
    </template>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button" type="button" @click="toggle(row, 'show')">{{ flagOn(row.show) ? t('admin.hide') : t('admin.show') }}</button>
        <button class="action-button" type="button" @click="copyNode(row)">{{ t('admin.nodes.copy') }}</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>

    <AdminDialog :show="open" :title="form.id ? t('admin.edit') : t('admin.create')" wide @close="open = false">
      <div class="filter-grid">
        <div class="form-group">
          <label class="form-label">类型</label>
          <select v-model="form.type" class="form-control">
            <option v-for="item in types" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">名称</label><input v-model="form.name" class="form-control" /></div>
        <div class="form-group"><label class="form-label">标识 code</label><input v-model="form.code" class="form-control" /></div>
        <div class="form-group"><label class="form-label">地址</label><input v-model="form.host" class="form-control" /></div>
        <div class="form-group"><label class="form-label">连接端口</label><input v-model="form.port" class="form-control" /></div>
        <div class="form-group"><label class="form-label">服务端口</label><input v-model="form.server_port" class="form-control" /></div>
        <div class="form-group"><label class="form-label">倍率</label><input v-model="form.rate" class="form-control" /></div>
        <div class="form-group"><label class="form-label">排序</label><input v-model="form.sort" class="form-control" /></div>
        <div class="form-group">
          <label class="form-label">分组</label>
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
      <div class="form-group">
        <label class="form-label">protocol_settings JSON</label>
        <textarea v-model="form.protocol_settings" class="form-control" rows="6"></textarea>
      </div>
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
  </AdminFrame>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractData, extractRows } from '@/api/admin/http';
import { copyAdminNode, dropAdminNode, fetchAdminNodes, fetchProtocolMeta, fetchServerGroups, fetchServerRoutes, saveAdminNode, updateAdminNode } from '@/api/admin/server';
import { flagOn } from '@/utils/adminFormat';
import { NODE_TYPE_FALLBACK } from '@/utils/adminLabels';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const rows = ref([]);
const groups = ref([]);
const routes = ref([]);
const types = ref(NODE_TYPE_FALLBACK);
const open = ref(false);
const pending = ref(null);
const form = reactive(emptyForm());

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '名称' },
  { key: 'type', label: '类型' },
  { key: 'host', label: '地址' },
  { key: 'port', label: '端口' },
  { key: 'show', label: '显示', format: (row) => (flagOn(row.show) ? '是' : '否') }
];

function emptyForm() {
  return {
    id: null, type: 'vmess', code: '', name: '', host: '', port: '443', server_port: '443',
    rate: '1', sort: '0', group_ids: [], route_ids: [], protocol_settings: '{}', show: true, enabled: true
  };
}

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }

function idList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function payload() {
  let protocol = {};
  try { protocol = JSON.parse(form.protocol_settings || '{}'); }
  catch (e) { throw new Error('protocol_settings 不是合法 JSON'); }
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
    protocol_settings: protocol,
    show: form.show ? 1 : 0,
    enabled: form.enabled ? 1 : 0,
    sort: Number(form.sort) || 0,
    rate_time_enable: 0,
    parent_id: null
  };
  if (form.id) body.id = form.id;
  return body;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [nodeRes, groupRes, routeRes] = await Promise.all([fetchAdminNodes(), fetchServerGroups(), fetchServerRoutes()]);
    rows.value = extractRows(nodeRes);
    groups.value = extractRows(groupRes);
    routes.value = extractRows(routeRes);
    try {
      const meta = extractData(await fetchProtocolMeta()) || {};
      if (Array.isArray(meta.types) && meta.types.length) types.value = meta.types;
    } catch (e) { types.value = NODE_TYPE_FALLBACK; }
  } catch (e) {
    error.value = adminErrorMessage(e, t('admin.failed'));
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, emptyForm());
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
    group_ids: idList(row.group_ids),
    route_ids: idList(row.route_ids),
    protocol_settings: JSON.stringify(row.protocol_settings || {}, null, 2),
    show: flagOn(row.show),
    enabled: row.enabled == null ? true : flagOn(row.enabled)
  });
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

async function toggle(row, field) {
  try {
    const body = {
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
      show: flagOn(row.show) ? 1 : 0,
      enabled: row.enabled == null || flagOn(row.enabled) ? 1 : 0,
      sort: Number(row.sort) || 0,
      rate_time_enable: flagOn(row.rate_time_enable) ? 1 : 0,
      parent_id: row.parent_id ?? null
    };
    body[field] = flagOn(row[field]) ? 0 : 1;
    await updateAdminNode(body);
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

onMounted(load);
</script>
