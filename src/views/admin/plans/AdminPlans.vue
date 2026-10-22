<template>
  <AdminFrame :title="t('admin.plans.title')" :description="t('admin.plans.description')" :loading="loading" :error="error" @retry="load">
    <template #tools>
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
      <button class="action-button" type="button" @click="saveSort">排序</button>
    </template>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button" type="button" @click="toggle(row, 'show')">{{ flagOn(row.show) ? t('admin.hide') : t('admin.show') }}</button>
        <button class="action-button" type="button" @click="toggle(row, 'sell')">{{ flagOn(row.sell) ? '停售' : t('admin.plans.sell') }}</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>

    <AdminDialog :show="open" :title="form.id ? t('admin.edit') : t('admin.create')" wide @close="open = false">
      <div class="filter-grid">
        <div class="form-group"><label class="form-label">名称</label><input v-model="form.name" class="form-control" /></div>
        <div class="form-group"><label class="form-label">分组 ID</label><input v-model="form.group_id" class="form-control" /></div>
        <div class="form-group"><label class="form-label">流量 GB</label><input v-model="form.transfer_enable" class="form-control" /></div>
        <div class="form-group"><label class="form-label">排序</label><input v-model="form.sort" class="form-control" /></div>
        <div class="form-group" v-for="item in PLAN_PRICE_FIELDS" :key="item.period">
          <label class="form-label">{{ item.label }}（元）</label>
          <input v-model="form.prices[item.period]" class="form-control" />
        </div>
      </div>
      <div class="form-group"><label class="form-label">说明</label><textarea v-model="form.content" class="form-control" rows="4"></textarea></div>
      <label class="check-line"><input v-model="form.show" type="checkbox" /> {{ t('admin.show') }}</label>
      <label class="check-line"><input v-model="form.sell" type="checkbox" /> {{ t('admin.plans.sell') }}</label>
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
import { adminErrorMessage, extractRows } from '@/api/admin/http';
import { dropAdminPlan, fetchAdminPlans, saveAdminPlan, sortAdminPlans, updateAdminPlan } from '@/api/admin/plan';
import { flagOn } from '@/utils/adminFormat';
import { PLAN_PRICE_FIELDS } from '@/utils/adminLabels';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const rows = ref([]);
const open = ref(false);
const pending = ref(null);
const form = reactive(emptyForm());

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '名称' },
  { key: 'transfer_enable', label: '流量' },
  { key: 'month_price', label: '月付', format: (row) => row.month_price ?? '—' },
  { key: 'show', label: '显示', format: (row) => (flagOn(row.show) ? '是' : '否') },
  { key: 'sell', label: '在售', format: (row) => (flagOn(row.sell) ? '是' : '否') },
  { key: 'sort', label: '排序' }
];

function emptyForm() {
  const prices = {};
  PLAN_PRICE_FIELDS.forEach((item) => { prices[item.period] = ''; });
  return { id: null, name: '', group_id: '1', transfer_enable: '100', sort: '0', content: '', show: true, sell: true, prices };
}

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }

function payloadFrom(source, patch = {}) {
  const prices = {};
  const body = {
    group_id: Number(source.group_id || 1),
    name: source.name,
    transfer_enable: Number(source.transfer_enable || 0),
    show: flagOn(source.show) ? 1 : 0,
    sell: flagOn(source.sell) ? 1 : 0,
    sort: Number(source.sort || 0),
    renew: Number(source.renew || 0),
    content: source.content || '',
    tags: Array.isArray(source.tags) ? source.tags : [],
    speed_limit: source.speed_limit ?? null,
    device_limit: source.device_limit ?? null,
    capacity_limit: source.capacity_limit ?? null,
    reset_traffic_method: source.reset_traffic_method ?? null,
    ...patch
  };
  PLAN_PRICE_FIELDS.forEach(({ field, period }) => {
    const raw = source.prices ? source.prices[period] : source[field];
    if (raw !== '' && raw != null) {
      const n = Number(raw);
      if (Number.isFinite(n)) {
        prices[period] = n;
        body[field] = n;
      }
    }
  });
  body.prices = prices;
  if (source.id != null) body.id = source.id;
  return body;
}

async function load() {
  loading.value = true;
  error.value = '';
  try { rows.value = extractRows(await fetchAdminPlans()); }
  catch (e) { error.value = adminErrorMessage(e, t('admin.failed')); }
  finally { loading.value = false; }
}

function openCreate() {
  Object.assign(form, emptyForm());
  open.value = true;
}

function openEdit(row) {
  const prices = {};
  PLAN_PRICE_FIELDS.forEach(({ field, period }) => { prices[period] = row[field] == null ? '' : String(row[field]); });
  Object.assign(form, {
    id: row.id,
    name: row.name || '',
    group_id: String(row.group_id ?? 1),
    transfer_enable: String(row.transfer_enable ?? 0),
    sort: String(row.sort ?? 0),
    content: row.content || '',
    show: flagOn(row.show),
    sell: flagOn(row.sell),
    prices
  });
  open.value = true;
}

async function submit() {
  try {
    const body = payloadFrom(form);
    if (form.id) await updateAdminPlan(body);
    else await saveAdminPlan(body);
    open.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

async function toggle(row, field) {
  try {
    const next = flagOn(row[field]) ? 0 : 1;
    await updateAdminPlan(payloadFrom(row, { id: row.id, [field]: next }));
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

function remove(row) {
  pending.value = {
    text: `删除套餐「${row.name}」？`,
    run: async () => {
      try { await dropAdminPlan(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); }
    }
  };
}

async function runPending() {
  const job = pending.value;
  pending.value = null;
  if (job) await job.run();
}

async function saveSort() {
  try {
    const ids = [...rows.value].sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)).map((row) => Number(row.id));
    await sortAdminPlans(ids);
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}

onMounted(load);
</script>
