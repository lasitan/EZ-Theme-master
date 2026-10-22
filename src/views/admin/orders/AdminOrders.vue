<template>
  <AdminFrame :title="t('admin.orders.title')" :description="t('admin.orders.description')" :loading="loading" :error="error" @retry="load">
    <template #tools>
      <button class="action-button" type="button" @click="openAssign">{{ t('admin.orders.assign') }}</button>
    </template>
    <div class="filter-grid">
      <div class="form-group"><input v-model="filters.trade_no" class="form-control" placeholder="trade_no" /></div>
      <div class="form-group"><input v-model="filters.user_id" class="form-control" placeholder="user_id" /></div>
      <div class="form-group">
        <select v-model="filters.status" class="form-control">
          <option value="">状态</option>
          <option v-for="(label, key) in ORDER_STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="form-group">
        <select v-model="filters.period" class="form-control">
          <option value="">周期</option>
          <option v-for="(label, key) in PERIOD_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="form-group"><button class="btn btn-primary" type="button" @click="load">{{ t('admin.search') }}</button></div>
    </div>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openDetail(row)">{{ t('admin.orders.detail') }}</button>
        <button v-if="Number(row.status) === 0" class="action-button" type="button" @click="markPaid(row)">{{ t('admin.orders.paid') }}</button>
        <button v-if="Number(row.status) === 0" class="action-button danger" type="button" @click="cancel(row)">{{ t('admin.cancel') }}</button>
        <button class="action-button" type="button" @click="openPrice(row)">{{ t('admin.orders.price') }}</button>
        <button v-if="Number(row.commission_balance) > 0" class="action-button" type="button" @click="commission(row, 'pay')">{{ t('admin.orders.commissionPay') }}</button>
        <button v-if="Number(row.commission_balance) > 0" class="action-button danger" type="button" @click="commission(row, 'invalid')">{{ t('admin.orders.commissionInvalid') }}</button>
      </template>
    </AdminTable>

    <AdminDialog :show="detailOpen" :title="t('admin.orders.detail')" wide @close="detailOpen = false">
      <div class="kv">
        <span>单号</span><span>{{ textOf(detail.trade_no) }}</span>
        <span>用户</span><span>{{ detailEmail || textOf(detail.user_id) }}</span>
        <span>状态</span><span>{{ labelOf(ORDER_STATUS_LABELS, detail.status) }}</span>
        <span>金额</span><span>¥{{ yuanFromCent(detail.total_amount) }}</span>
        <span>周期</span><span>{{ PERIOD_LABELS[detail.period] || textOf(detail.period) }}</span>
        <span>佣金</span><span>¥{{ yuanFromCent(detail.commission_balance) }} / {{ labelOf(COMMISSION_STATUS_LABELS, detail.commission_status) }}</span>
      </div>
    </AdminDialog>

    <AdminDialog :show="priceOpen" :title="t('admin.orders.price')" @close="priceOpen = false">
      <div class="form-group">
        <label class="form-label">金额（元）</label>
        <input v-model="priceYuan" class="form-control" />
      </div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="priceOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="savePrice">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>

    <AdminDialog :show="assignOpen" :title="t('admin.orders.assign')" @close="assignOpen = false">
      <div class="form-group"><label class="form-label">邮箱</label><input v-model="assign.email" class="form-control" /></div>
      <div class="form-group">
        <label class="form-label">套餐</label>
        <select v-model="assign.plan_id" class="form-control">
          <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">周期</label>
        <select v-model="assign.period" class="form-control">
          <option v-for="item in PLAN_PRICE_FIELDS" :key="item.period" :value="item.period">{{ item.label }}</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">金额（元）</label><input v-model="assign.amount" class="form-control" /></div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="assignOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="submitAssign">{{ t('admin.save') }}</button>
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
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractData, extractRows } from '@/api/admin/http';
import { cancelAdminOrder, commissionAdminOrder, createAdminOrder, fetchAdminOrderDetail, fetchAdminOrders, markAdminOrderPaid, updateAdminOrderAmount } from '@/api/admin/order';
import { fetchAdminPlans } from '@/api/admin/plan';
import { fetchAdminUserById } from '@/api/admin/user';
import { centFromYuan, textOf, yuanFromCent } from '@/utils/adminFormat';
import { COMMISSION_STATUS_LABELS, labelOf, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, PERIOD_LABELS, PLAN_PRICE_FIELDS } from '@/utils/adminLabels';

const { t } = useI18n();
const route = useRoute();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const rows = ref([]);
const plans = ref([]);
const filters = reactive({ trade_no: '', user_id: '', status: '', period: '' });
const detailOpen = ref(false);
const detail = ref({});
const detailEmail = ref('');
const priceOpen = ref(false);
const priceYuan = ref('');
const priceId = ref(null);
const assignOpen = ref(false);
const assign = reactive({ email: '', plan_id: '', period: 'monthly', amount: '0' });
const pending = ref(null);

const columns = [
  { key: 'trade_no', label: '单号' },
  { key: 'type', label: '类型', format: (row) => labelOf(ORDER_TYPE_LABELS, row.type) },
  { key: 'period', label: '周期', format: (row) => PERIOD_LABELS[row.period] || textOf(row.period) },
  { key: 'total_amount', label: '金额', format: (row) => `¥${yuanFromCent(row.total_amount)}` },
  { key: 'status', label: '状态', format: (row) => labelOf(ORDER_STATUS_LABELS, row.status) }
];

function fail(e) {
  showToast(adminErrorMessage(e, t('admin.failed')), 'error');
}

function buildFilter() {
  const filter = [];
  if (filters.trade_no) filter.push({ id: 'trade_no', value: filters.trade_no.trim() });
  if (filters.user_id) filter.push({ id: 'user_id', value: filters.user_id });
  if (filters.status !== '') filter.push({ id: 'status', value: Number(filters.status) });
  if (filters.period) filter.push({ id: 'period', value: filters.period });
  return filter;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetchAdminOrders(buildFilter(), [{ id: 'created_at', order: 'desc' }]);
    rows.value = extractRows(res);
  } catch (e) {
    error.value = adminErrorMessage(e, t('admin.failed'));
  } finally {
    loading.value = false;
  }
}

async function openDetail(row) {
  detailOpen.value = true;
  detail.value = row;
  detailEmail.value = '';
  try {
    const res = await fetchAdminOrderDetail(row.id);
    const data = extractData(res) || {};
    detail.value = data.order || data.data || data;
    const userId = detail.value.user_id;
    if (userId) {
      const userRes = await fetchAdminUserById(userId);
      const userData = extractData(userRes) || {};
      const user = userData.user || userData;
      detailEmail.value = user.email || '';
    }
  } catch (e) {
    fail(e);
  }
}

function ask(text, run) {
  pending.value = { text, run };
}

async function runPending() {
  const job = pending.value;
  pending.value = null;
  if (job) await job.run();
}

function markPaid(row) {
  ask('标记该订单为已支付？', async () => {
    try { await markAdminOrderPaid(row.id); showToast(t('admin.saved'), 'success'); await load(); } catch (e) { fail(e); }
  });
}

function cancel(row) {
  ask('取消该订单？', async () => {
    try { await cancelAdminOrder(row.id); showToast(t('admin.saved'), 'success'); await load(); } catch (e) { fail(e); }
  });
}

function commission(row, action) {
  ask(action === 'pay' ? '发放这笔佣金？' : '将佣金标为无效？', async () => {
    try { await commissionAdminOrder(row.id, action); showToast(t('admin.saved'), 'success'); await load(); } catch (e) { fail(e); }
  });
}

function openPrice(row) {
  priceId.value = row.id;
  priceYuan.value = (Number(row.total_amount || 0) / 100).toString();
  priceOpen.value = true;
}

async function savePrice() {
  try {
    await updateAdminOrderAmount(priceId.value, centFromYuan(priceYuan.value));
    priceOpen.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) {
    fail(e);
  }
}

async function openAssign() {
  assignOpen.value = true;
  if (!plans.value.length) {
    try {
      plans.value = extractRows(await fetchAdminPlans());
      if (plans.value[0]) assign.plan_id = plans.value[0].id;
    } catch (e) {
      fail(e);
    }
  }
}

async function submitAssign() {
  try {
    await createAdminOrder({
      email: assign.email.trim(),
      plan_id: Number(assign.plan_id),
      period: assign.period,
      total_amount: centFromYuan(assign.amount)
    });
    assignOpen.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) {
    fail(e);
  }
}

onMounted(() => {
  if (route.query.user_id) filters.user_id = String(route.query.user_id);
  load();
});
</script>
