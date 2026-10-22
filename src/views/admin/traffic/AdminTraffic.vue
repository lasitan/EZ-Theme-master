<template>
  <AdminFrame :title="t('admin.traffic.title')" :description="pageDesc" :loading="loading" :error="error" @retry="load">
    <div class="subtabs">
      <button class="subtab" :class="{ active: tab === 'resets' }" type="button" @click="tab = 'resets'">{{ t('admin.traffic.resets') }}</button>
      <button class="subtab" :class="{ active: tab === 'usage' }" type="button" @click="openUsage()">{{ t('admin.traffic.usage') }}</button>
    </div>
    <AdminTable v-if="tab === 'resets'" :rows="logs" :columns="logColumns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openUsage(row.user_id, row.email)">{{ t('admin.traffic.usage') }}</button>
      </template>
    </AdminTable>
    <div v-else>
      <div class="filter-grid">
        <div class="form-group"><input v-model="userId" class="form-control" placeholder="user_id" /></div>
        <div class="form-group">
          <select v-model="recordType" class="form-control">
            <option value="d">按日</option>
            <option value="m">按月</option>
          </select>
        </div>
        <div class="form-group"><button class="btn btn-primary" type="button" @click="loadUsage">{{ t('admin.search') }}</button></div>
      </div>
      <AdminTable :rows="usage" :columns="usageColumns" />
    </div>
  </AdminFrame>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import AdminTable from '@/components/admin/AdminTable.vue';
import { adminErrorMessage, extractRows } from '@/api/admin/http';
import { fetchAdminUserTraffic } from '@/api/admin/user';
import { fetchTrafficResetLogs } from '@/api/admin/traffic';
import { formatUnix, textOf } from '@/utils/adminFormat';

const { t } = useI18n();
const route = useRoute();
const loading = ref(true);
const error = ref('');
const tab = ref('resets');
const logs = ref([]);
const usage = ref([]);
const userId = ref('');
const userLabel = ref('');
const recordType = ref('d');
const pageDesc = computed(() => (userLabel.value ? `${t('admin.traffic.description')} · ${userLabel.value}` : t('admin.traffic.description')));
const logColumns = [
  { key: 'id', label: 'ID' },
  { key: 'user_id', label: '用户', format: (row) => row.email || row.user_id || '—' },
  { key: 'reset_at', label: '时间', format: (row) => formatUnix(row.reset_at || row.created_at) },
  { key: 'remark', label: '说明', format: (row) => textOf(row.remark || row.type || row.source) }
];
const usageColumns = [
  { key: 'record_at', label: '时间', format: (row) => formatUnix(row.record_at || row.date || row.created_at) },
  { key: 'u', label: '上行', format: (row) => textOf(row.u ?? row.upload) },
  { key: 'd', label: '下行', format: (row) => textOf(row.d ?? row.download) }
];

async function load() {
  loading.value = true;
  error.value = '';
  try { logs.value = extractRows(await fetchTrafficResetLogs()); }
  catch (e) { error.value = adminErrorMessage(e, t('admin.failed')); }
  finally { loading.value = false; }
}

async function loadUsage() {
  if (!userId.value) return;
  loading.value = true;
  try {
    usage.value = extractRows(await fetchAdminUserTraffic({
      user_id: Number(userId.value),
      current: 1,
      pageSize: 100,
      record_type: recordType.value
    }));
    tab.value = 'usage';
  } catch (e) {
    error.value = adminErrorMessage(e, t('admin.failed'));
  } finally {
    loading.value = false;
  }
}

function openUsage(id, label) {
  if (id) userId.value = String(id);
  if (label) userLabel.value = label;
  tab.value = 'usage';
  if (userId.value) loadUsage();
}

onMounted(async () => {
  await load();
  if (route.query.user_id) openUsage(route.query.user_id, route.query.user_label);
});
</script>
