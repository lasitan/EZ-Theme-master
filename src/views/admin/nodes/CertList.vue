<template>
  <div>
    <div class="toolbar">
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
    </div>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="issue(row)">签发</button>
        <button class="action-button" type="button" @click="renew(row)">续期</button>
        <button class="action-button" type="button" @click="openBind(row)">绑定</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>
    <AdminDialog :show="editOpen" :title="t('admin.create')" @close="editOpen = false">
      <div class="form-group"><label class="form-label">域名</label><input v-model="form.domain" class="form-control" /></div>
      <div class="form-group">
        <label class="form-label">附加域名 <InfoTip text="一行一个。" /></label>
        <textarea v-model="form.san" class="form-control" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">签发商</label>
        <select v-model="form.provider" class="form-control">
          <option value="cloudflare">Cloudflare</option>
        </select>
      </div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="editOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="submit">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>
    <AdminDialog :show="bindOpen" title="绑定节点" @close="bindOpen = false">
      <div class="form-group">
        <label class="form-label">节点</label>
        <select v-model="bind.server_id" class="form-control">
          <option v-for="item in nodes" :key="item.id" :value="item.id">{{ item.name || item.id }}</option>
        </select>
      </div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="bindOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="submitBind">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import InfoTip from '@/components/admin/InfoTip.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractRows } from '@/api/admin/http';
import { bindCertificate, dropCertificate, fetchAdminNodes, fetchCertificates, issueCertificate, renewCertificate, saveCertificate } from '@/api/admin/server';
import { formatUnix } from '@/utils/adminFormat';

const { t } = useI18n();
const { showToast } = useToast();
const rows = ref([]);
const nodes = ref([]);
const editOpen = ref(false);
const bindOpen = ref(false);
const form = reactive({ domain: '', san: '', provider: 'cloudflare' });
const bind = reactive({ certificate_id: null, server_id: '' });
const columns = [
  { key: 'domain', label: '域名' },
  { key: 'status', label: '状态', format: (row) => ({ issued: '已签发', pending: '待签发', failed: '失败' }[row.status] || row.status || '—') },
  { key: 'provider', label: '签发商' },
  { key: 'expires_at', label: '到期', format: (row) => formatUnix(row.expires_at) },
  { key: 'last_error', label: '最近错误', format: (row) => row.last_error || '—' }
];

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
async function load() {
  rows.value = extractRows(await fetchCertificates());
  nodes.value = extractRows(await fetchAdminNodes());
}
function openCreate() {
  Object.assign(form, { domain: '', san: '', provider: 'cloudflare' });
  editOpen.value = true;
}
async function submit() {
  try {
    const san = form.san.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    await saveCertificate({ domain: form.domain.trim(), san, provider: form.provider });
    editOpen.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}
async function issue(row) {
  try { await issueCertificate(row.id); showToast(t('admin.saved'), 'success'); await load(); } catch (e) { fail(e); }
}
async function renew(row) {
  try { await renewCertificate(row.id); showToast(t('admin.saved'), 'success'); await load(); } catch (e) { fail(e); }
}
function openBind(row) {
  bind.certificate_id = row.id;
  bind.server_id = nodes.value[0] ? nodes.value[0].id : '';
  bindOpen.value = true;
}
async function submitBind() {
  try {
    await bindCertificate(bind.server_id, bind.certificate_id);
    bindOpen.value = false;
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}
async function remove(row) {
  try { await dropCertificate(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); }
}
onMounted(load);
</script>
