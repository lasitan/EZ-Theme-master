<template>
  <AdminFrame :title="t('admin.coupons.title')" :description="t('admin.coupons.description')" :loading="loading" :error="error" @retry="load">
    <template #tools>
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
    </template>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button" type="button" @click="toggle(row)">{{ flagOn(row.show) ? t('admin.disable') : t('admin.enable') }}</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>
    <AdminDialog :show="open" :title="form.id ? t('admin.edit') : t('admin.create')" wide @close="open = false">
      <div class="filter-grid">
        <div class="form-group"><label class="form-label">名称</label><input v-model="form.name" class="form-control" /></div>
        <div class="form-group"><label class="form-label">券码</label><input v-model="form.code" class="form-control" /></div>
        <div class="form-group">
          <label class="form-label">类型</label>
          <select v-model="form.type" class="form-control">
            <option value="1">固定金额（分）</option>
            <option value="2">百分比</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">{{ form.type === '2' ? '减免百分比' : '金额（分）' }}</label><input v-model="form.value" class="form-control" /></div>
        <div class="form-group"><label class="form-label">开始</label><input v-model="form.started_at" class="form-control" type="datetime-local" /></div>
        <div class="form-group"><label class="form-label">结束</label><input v-model="form.ended_at" class="form-control" type="datetime-local" /></div>
        <div class="form-group"><label class="form-label">总次数</label><input v-model="form.limit_use" class="form-control" /></div>
        <div class="form-group"><label class="form-label">每人次数</label><input v-model="form.limit_user_use" class="form-control" /></div>
        <div class="form-group"><label class="form-label">适用周期</label><input v-model="form.use_with_periods" class="form-control" /></div>
        <div v-if="!form.id" class="form-group"><label class="form-label">生成数量</label><input v-model="form.generate_count" class="form-control" /></div>
      </div>
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
import { dropAdminCoupon, fetchAdminCoupons, generateAdminCoupon, showAdminCoupon, updateAdminCoupon } from '@/api/admin/coupon';
import { flagOn, formatUnix, localInputToUnix, unixToLocalInput, yuanFromCent } from '@/utils/adminFormat';

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
  { key: 'code', label: '券码' },
  { key: 'value', label: '力度', format: (row) => (Number(row.type) === 2 ? `${row.value}%` : `¥${yuanFromCent(row.value)}`) },
  { key: 'show', label: '状态', format: (row) => (flagOn(row.show) ? '启用' : '停用') },
  { key: 'ended_at', label: '结束', format: (row) => formatUnix(row.ended_at) }
];

function emptyForm() {
  return { id: null, name: '', code: '', type: '1', value: '0', started_at: '', ended_at: '', limit_use: '', limit_user_use: '', use_with_periods: '', generate_count: '1' };
}
function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
async function load() {
  loading.value = true;
  error.value = '';
  try { rows.value = extractRows(await fetchAdminCoupons()); }
  catch (e) { error.value = adminErrorMessage(e, t('admin.failed')); }
  finally { loading.value = false; }
}
function openCreate() { Object.assign(form, emptyForm()); open.value = true; }
function openEdit(row) {
  Object.assign(form, {
    id: row.id, name: row.name || '', code: row.code || '', type: String(row.type || 1), value: String(row.value ?? 0),
    started_at: unixToLocalInput(row.started_at), ended_at: unixToLocalInput(row.ended_at),
    limit_use: row.limit_use ?? '', limit_user_use: row.limit_user_use ?? '', use_with_periods: row.use_with_periods || '', generate_count: '1'
  });
  open.value = true;
}
async function submit() {
  const started = localInputToUnix(form.started_at);
  const ended = localInputToUnix(form.ended_at);
  if (started == null || ended == null) { fail(new Error('请填写有效期')); return; }
  const body = { name: form.name.trim(), type: Number(form.type), value: Number(form.value), show: 1, started_at: started, ended_at: ended };
  if (form.code.trim()) body.code = form.code.trim();
  if (form.limit_use !== '') body.limit_use = Number(form.limit_use);
  if (form.limit_user_use !== '') body.limit_user_use = Number(form.limit_user_use);
  if (form.use_with_periods) body.use_with_periods = form.use_with_periods;
  if (!form.id && Number(form.generate_count) > 1) body.generate_count = Number(form.generate_count);
  if (form.id) body.id = form.id;
  try {
    if (form.id) await updateAdminCoupon(body);
    else await generateAdminCoupon(body);
    open.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}
async function toggle(row) {
  try { await showAdminCoupon(row.id, flagOn(row.show) ? 0 : 1); await load(); } catch (e) { fail(e); }
}
function remove(row) {
  pending.value = { text: '删除该优惠券？', run: async () => { try { await dropAdminCoupon(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); } } };
}
async function runPending() { const job = pending.value; pending.value = null; if (job) await job.run(); }
onMounted(load);
</script>
