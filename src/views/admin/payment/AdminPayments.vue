<template>
  <AdminFrame :title="t('admin.payments.title')" :description="t('admin.payments.description')" :loading="loading" :error="error" @retry="load">
    <template #tools>
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
      <button class="action-button" type="button" @click="saveSort">排序</button>
    </template>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button" type="button" @click="toggle(row)">{{ flagOn(row.enable) ? t('admin.disable') : t('admin.enable') }}</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>
    <AdminDialog :show="open" :title="form.id ? t('admin.edit') : t('admin.create')" wide @close="open = false">
      <div class="filter-grid">
        <div class="form-group"><label class="form-label">名称</label><input v-model="form.name" class="form-control" /></div>
        <div class="form-group">
          <label class="form-label">标识</label>
          <select v-model="form.payment" class="form-control" @change="loadForm">
            <option v-for="item in methods" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">排序</label><input v-model="form.sort" class="form-control" /></div>
        <div class="form-group"><label class="form-label">UUID</label><input v-model="form.uuid" class="form-control" /></div>
      </div>
      <div v-for="field in formFields" :key="field.name" class="form-group">
        <label class="form-label">{{ field.label }}</label>
        <input v-model="form.config[field.name]" class="form-control" />
      </div>
      <div v-if="!formFields.length" class="form-group">
        <label class="form-label">config JSON</label>
        <textarea v-model="configText" class="form-control" rows="6"></textarea>
      </div>
      <label class="check-line"><input v-model="form.enable" type="checkbox" /> {{ t('admin.enable') }}</label>
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
import { dropAdminPayment, fetchAdminPayments, fetchPaymentForm, fetchPaymentMethods, saveAdminPayment, showAdminPayment, sortAdminPayments } from '@/api/admin/payment';
import { flagOn } from '@/utils/adminFormat';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const rows = ref([]);
const methods = ref([]);
const open = ref(false);
const pending = ref(null);
const formFields = ref([]);
const configText = ref('{}');
const form = reactive({ id: null, name: '', payment: '', sort: '0', uuid: '', enable: true, config: {} });
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '名称' },
  { key: 'payment', label: '标识' },
  { key: 'enable', label: '启用', format: (row) => (flagOn(row.enable) ? '是' : '否') },
  { key: 'sort', label: '排序' }
];

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }

function normalizeMethods(payload) {
  const data = extractData(payload) || {};
  const list = Array.isArray(data.methods) ? data.methods : extractRows(payload);
  return list.map((item) => {
    if (typeof item === 'string') return { value: item, label: item };
    const value = String(item.value || item.payment || item.name || '');
    return { value, label: String(item.label || item.name || value) };
  }).filter((item) => item.value);
}

function normalizeFields(formData) {
  if (!formData) return [];
  if (Array.isArray(formData)) {
    return formData.map((item, index) => ({
      name: item.name || item.field || item.key || `field_${index}`,
      label: item.label || item.name || item.field || `字段 ${index + 1}`
    }));
  }
  if (typeof formData === 'object') {
    return Object.keys(formData).map((key) => {
      const item = formData[key];
      if (item && typeof item === 'object') return { name: item.name || key, label: item.label || key };
      return { name: key, label: key };
    });
  }
  return [];
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    rows.value = extractRows(await fetchAdminPayments());
    methods.value = normalizeMethods(await fetchPaymentMethods());
  } catch (e) { error.value = adminErrorMessage(e, t('admin.failed')); }
  finally { loading.value = false; }
}

async function loadForm() {
  try {
    const res = await fetchPaymentForm(form.id ? { id: form.id, payment: form.payment } : { payment: form.payment });
    const data = extractData(res) || {};
    formFields.value = normalizeFields(data.form);
  } catch (e) {
    formFields.value = [];
  }
}

function openCreate() {
  Object.assign(form, { id: null, name: '', payment: methods.value[0] ? methods.value[0].value : '', sort: '0', uuid: '', enable: true, config: {} });
  configText.value = '{}';
  formFields.value = [];
  open.value = true;
  if (form.payment) loadForm();
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id, name: row.name || '', payment: row.payment || '', sort: String(row.sort ?? 0),
    uuid: row.uuid || '', enable: flagOn(row.enable), config: { ...(row.config || {}) }
  });
  configText.value = JSON.stringify(row.config || {}, null, 2);
  open.value = true;
  loadForm();
}

async function submit() {
  let config = form.config;
  if (!formFields.value.length) {
    try { config = JSON.parse(configText.value || '{}'); }
    catch (e) { fail(new Error('config 不是合法 JSON')); return; }
  }
  const body = {
    name: form.name.trim(), payment: form.payment, config, enable: form.enable ? 1 : 0, sort: Number(form.sort) || 0
  };
  if (form.uuid) body.uuid = form.uuid;
  if (form.id) body.id = form.id;
  else if (crypto.randomUUID) body.uuid = body.uuid || crypto.randomUUID();
  try {
    await saveAdminPayment(body);
    open.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

async function toggle(row) {
  try { await showAdminPayment(row.id, flagOn(row.enable) ? 0 : 1); await load(); } catch (e) { fail(e); }
}
function remove(row) {
  pending.value = { text: '删除该支付方式？', run: async () => { try { await dropAdminPayment(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); } } };
}
async function runPending() { const job = pending.value; pending.value = null; if (job) await job.run(); }
async function saveSort() {
  try {
    await sortAdminPayments([...rows.value].sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)).map((row) => Number(row.id)));
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}
onMounted(load);
</script>
