<template>
  <AdminFrame
    :title="t('admin.overview.title')"
    :description="t('admin.overview.description')"
    :loading="loading"
    :error="error"
    @retry="load"
  >
    <template #tools>
      <button class="action-button" type="button" @click="load">{{ t('admin.refresh') }}</button>
    </template>

    <div class="stats-grid">
      <div class="stats-card static">
        <div class="stats-info">
          <div class="stats-value">¥{{ yuanFromCent(stats.todayIncome) }}</div>
          <div class="stats-label">{{ t('admin.overview.todayIncome') }}</div>
        </div>
      </div>
      <div class="stats-card static">
        <div class="stats-info">
          <div class="stats-value">¥{{ yuanFromCent(stats.currentMonthIncome) }}</div>
          <div class="stats-label">{{ t('admin.overview.monthIncome') }}</div>
        </div>
      </div>
      <div class="stats-card static">
        <div class="stats-info">
          <div class="stats-value">{{ countOf(stats.ticketPendingTotal) }}</div>
          <div class="stats-label">{{ t('admin.overview.tickets') }}</div>
        </div>
      </div>
      <div class="stats-card static">
        <div class="stats-info">
          <div class="stats-value">{{ countOf(stats.commissionPendingTotal) }}</div>
          <div class="stats-label">{{ t('admin.overview.commission') }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-card">
      <div class="card-header">
        <h3 class="card-title">{{ t('admin.overview.orders') }}</h3>
        <div class="subtabs">
          <button v-for="day in [7, 30, 90]" :key="day" class="subtab" :class="{ active: period === day }" type="button" @click="changePeriod(day)">
            {{ t(`admin.overview.days${day}`) }}
          </button>
        </div>
      </div>
      <div v-if="orderRows.length === 0" class="muted">{{ t('admin.empty') }}</div>
      <div v-for="row in orderRows" :key="row.date || row.record_at" class="bar-row">
        <span>{{ orderDate(row) }}</span>
        <div class="bar-track"><div class="bar-fill" :style="{ width: barWidth(row) }"></div></div>
        <span>¥{{ yuanFromCent(row.paid_total ?? row.value ?? 0) }}</span>
      </div>
    </div>

    <div class="dashboard-card">
      <div class="card-header">
        <h3 class="card-title">{{ t('admin.overview.rank') }}</h3>
        <div class="subtabs">
          <button class="subtab" :class="{ active: rankType === 'node' }" type="button" @click="setRank('node')">{{ t('admin.overview.nodeRank') }}</button>
          <button class="subtab" :class="{ active: rankType === 'user' }" type="button" @click="setRank('user')">{{ t('admin.overview.userRank') }}</button>
        </div>
      </div>
      <AdminTable :rows="rankRows" :columns="rankColumns" />
    </div>

    <div class="dashboard-card">
      <div class="card-header">
        <h3 class="card-title">{{ t('admin.overview.system') }}</h3>
      </div>
      <pre class="pre-block">{{ statusText }}</pre>
    </div>

    <div class="dashboard-card">
      <div class="card-header">
        <h3 class="card-title">{{ t('admin.overview.logs') }}</h3>
        <button class="action-button" type="button" @click="clearOpen = true">{{ t('admin.overview.clear') }}</button>
      </div>
      <div class="filter-grid">
        <div class="form-group">
          <input v-model="logQ" class="form-control" :placeholder="t('admin.search')" @change="loadLogs" />
        </div>
        <div class="form-group">
          <input v-model="logLevel" class="form-control" placeholder="level" @change="loadLogs" />
        </div>
      </div>
      <AdminTable :rows="logs" :columns="logColumns" />
    </div>

    <AdminDialog :show="clearOpen" :title="t('admin.overview.clear')" @close="clearOpen = false">
      <div class="form-group">
        <label class="form-label">days</label>
        <input v-model="clearDays" class="form-control" type="number" />
      </div>
      <div class="form-group">
        <label class="form-label">limit</label>
        <input v-model="clearLimit" class="form-control" type="number" placeholder="留空则按天数" />
      </div>
      <p v-if="clearStats" class="muted">{{ clearStats }}</p>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="clearOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="doClear">{{ t('admin.confirm') }}</button>
      </template>
    </AdminDialog>
  </AdminFrame>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractData, extractRows } from '@/api/admin/http';
import { fetchAdminStats, fetchAdminOrders, fetchTrafficRank, fetchSystemStatus, fetchSystemLog, fetchLogClearStats, clearSystemLog } from '@/api/admin/stat';
import { formatUnix, lastDaysRange, textOf, yuanFromCent } from '@/utils/adminFormat';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const stats = ref({});
const orderRows = ref([]);
const rankRows = ref([]);
const logs = ref([]);
const statusText = ref('—');
const period = ref(30);
const rankType = ref('node');
const logQ = ref('');
const logLevel = ref('');
const clearOpen = ref(false);
const clearDays = ref(30);
const clearLimit = ref('');
const clearStats = ref('');

const rankColumns = [
  { key: 'name', label: '名称', format: (row) => row.name || row.email || row.server_name || row.user_id || '—' },
  { key: 'total', label: '流量', format: (row) => textOf(row.total ?? row.u ?? row.d ?? row.value) }
];
const logColumns = [
  { key: 'created_at', label: '时间', format: (row) => formatUnix(row.created_at || row.time) },
  { key: 'level', label: '级别' },
  { key: 'title', label: '内容', format: (row) => textOf(row.title || row.message || row.content || row.desc) }
];

const maxOrder = computed(() => Math.max(1, ...orderRows.value.map((row) => Number(row.paid_total ?? row.value ?? 0) || 0)));

function countOf(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function orderDate(row) {
  return String(row.date || row.record_at || row.day || '—').slice(0, 10);
}

function barWidth(row) {
  const n = Number(row.paid_total ?? row.value ?? 0) || 0;
  return `${Math.max(4, Math.round((n / maxOrder.value) * 100))}%`;
}

async function loadOrders() {
  const range = lastDaysRange(period.value);
  const res = await fetchAdminOrders(range.startYmd, range.endYmd);
  orderRows.value = extractRows(res).slice(-14);
}

async function loadRank() {
  const range = lastDaysRange(period.value);
  const res = await fetchTrafficRank(rankType.value, range.startUnix, range.endUnix);
  rankRows.value = extractRows(res).slice(0, 20);
}

async function loadLogs() {
  const params = { page: 1, page_size: 50 };
  if (logQ.value) params.q = logQ.value;
  if (logLevel.value) params.level = logLevel.value;
  const res = await fetchSystemLog(params);
  logs.value = extractRows(res);
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [statRes, statusRes] = await Promise.all([fetchAdminStats(), fetchSystemStatus()]);
    const data = extractData(statRes) || {};
    stats.value = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const status = extractData(statusRes);
    statusText.value = typeof status === 'string' ? status : JSON.stringify(status, null, 2);
    await Promise.all([loadOrders(), loadRank(), loadLogs()]);
    try {
      const clearRes = await fetchLogClearStats();
      clearStats.value = JSON.stringify(extractData(clearRes));
    } catch (e) {
      clearStats.value = '';
    }
  } catch (e) {
    error.value = adminErrorMessage(e, t('admin.failed'));
  } finally {
    loading.value = false;
  }
}

async function changePeriod(day) {
  period.value = day;
  try {
    await Promise.all([loadOrders(), loadRank()]);
  } catch (e) {
    showToast(adminErrorMessage(e, t('admin.failed')), 'error');
  }
}

async function setRank(type) {
  rankType.value = type;
  try {
    await loadRank();
  } catch (e) {
    showToast(adminErrorMessage(e, t('admin.failed')), 'error');
  }
}

async function doClear() {
  try {
    const body = clearLimit.value ? { limit: Number(clearLimit.value) } : { days: Number(clearDays.value) || 30 };
    await clearSystemLog(body);
    showToast(t('admin.saved'), 'success');
    clearOpen.value = false;
    await loadLogs();
  } catch (e) {
    showToast(adminErrorMessage(e, t('admin.failed')), 'error');
  }
}

onMounted(load);
</script>
