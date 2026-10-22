<template>
  <AdminFrame :title="t('admin.giftCards.title')" :description="t('admin.giftCards.description')" :loading="loading" :error="error" @retry="load">
    <div class="subtabs">
      <button class="subtab" :class="{ active: tab === 'templates' }" type="button" @click="tab = 'templates'">{{ t('admin.giftCards.templates') }}</button>
      <button class="subtab" :class="{ active: tab === 'codes' }" type="button" @click="tab = 'codes'">{{ t('admin.giftCards.codes') }}</button>
      <button class="subtab" :class="{ active: tab === 'usages' }" type="button" @click="tab = 'usages'">{{ t('admin.giftCards.usages') }}</button>
      <button class="subtab" :class="{ active: tab === 'stats' }" type="button" @click="tab = 'stats'">{{ t('admin.giftCards.stats') }}</button>
    </div>

    <div v-if="tab === 'templates'">
      <div class="toolbar" style="margin-bottom: 12px">
        <button class="action-button" type="button" @click="openTemplate()">{{ t('admin.create') }}</button>
      </div>
      <AdminTable :rows="templates" :columns="templateColumns">
        <template #actions="{ row }">
          <button class="action-button" type="button" @click="openTemplate(row)">{{ t('admin.edit') }}</button>
          <button class="action-button" type="button" @click="toggleTemplate(row)">{{ Number(row.status) === 1 ? t('admin.disable') : t('admin.enable') }}</button>
          <button class="action-button danger" type="button" @click="removeTemplate(row)">{{ t('admin.delete') }}</button>
        </template>
      </AdminTable>
    </div>

    <div v-else-if="tab === 'codes'">
      <div class="toolbar" style="margin-bottom: 12px">
        <button class="action-button" type="button" @click="genOpen = true">{{ t('admin.giftCards.generate') }}</button>
        <button class="action-button" type="button" @click="exportCodes">{{ t('admin.giftCards.export') }}</button>
      </div>
      <AdminTable :rows="codes" :columns="codeColumns">
        <template #actions="{ row }">
          <button class="action-button" type="button" @click="openCode(row)">{{ t('admin.edit') }}</button>
          <button class="action-button" type="button" @click="toggleCode(row)">{{ t('admin.enable') }}/{{ t('admin.disable') }}</button>
          <button class="action-button danger" type="button" @click="removeCode(row)">{{ t('admin.delete') }}</button>
        </template>
      </AdminTable>
    </div>

    <div v-else-if="tab === 'usages'">
      <div class="filter-grid">
        <div class="form-group"><input v-model="usageEmail" class="form-control" placeholder="user_email" /></div>
        <div class="form-group"><button class="btn btn-primary" type="button" @click="loadUsages">{{ t('admin.search') }}</button></div>
      </div>
      <AdminTable :rows="usages" :columns="usageColumns" />
    </div>

    <div v-else class="dashboard-card">
      <pre class="pre-block">{{ statsText }}</pre>
    </div>

    <AdminDialog :show="tplOpen" :title="tpl.id ? t('admin.edit') : t('admin.create')" wide @close="tplOpen = false">
      <div class="filter-grid">
        <div class="form-group"><label class="form-label">名称</label><input v-model="tpl.name" class="form-control" /></div>
        <div class="form-group"><label class="form-label">类型</label><input v-model="tpl.type" class="form-control" /></div>
        <div class="form-group"><label class="form-label">状态 1/0</label><input v-model="tpl.status" class="form-control" /></div>
        <div class="form-group"><label class="form-label">套餐 ID</label><input v-model="tpl.plan_id" class="form-control" /></div>
        <div class="form-group"><label class="form-label">时长（天）</label><input v-model="tpl.days" class="form-control" /></div>
        <div class="form-group"><label class="form-label">余额（元）</label><input v-model="tpl.balance" class="form-control" /></div>
        <div class="form-group"><label class="form-label">主题色</label><input v-model="tpl.theme_color" class="form-control" /></div>
      </div>
      <div class="form-group"><label class="form-label">说明</label><textarea v-model="tpl.description" class="form-control" rows="3"></textarea></div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="tplOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="saveTemplate">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>

    <AdminDialog :show="genOpen" :title="t('admin.giftCards.generate')" @close="genOpen = false">
      <div class="form-group">
        <label class="form-label">模板</label>
        <select v-model="gen.template_id" class="form-control">
          <option v-for="item in templates" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">数量</label><input v-model="gen.count" class="form-control" /></div>
      <div class="form-group"><label class="form-label">可用次数</label><input v-model="gen.max_usage" class="form-control" /></div>
      <div class="form-group"><label class="form-label">批次</label><input v-model="gen.batch_id" class="form-control" /></div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="genOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="generate">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>

    <AdminDialog :show="codeOpen" :title="t('admin.edit')" @close="codeOpen = false">
      <div class="form-group"><label class="form-label">可用次数</label><input v-model="codeForm.max_usage" class="form-control" /></div>
      <div class="form-group"><label class="form-label">批次</label><input v-model="codeForm.batch_id" class="form-control" /></div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="codeOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="saveCode">{{ t('admin.save') }}</button>
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
import { adminErrorMessage, extractData, extractRows, listBody, saveBlobOrThrow } from '@/api/admin/http';
import { createGiftTemplate, deleteGiftCode, deleteGiftTemplate, exportGiftCodes, fetchGiftCodes, fetchGiftStatistics, fetchGiftTemplates, fetchGiftUsages, generateGiftCodes, toggleGiftCode, updateGiftCode, updateGiftTemplate } from '@/api/admin/giftCard';
import { centFromYuan, formatUnix, textOf } from '@/utils/adminFormat';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const tab = ref('templates');
const templates = ref([]);
const codes = ref([]);
const usages = ref([]);
const statsText = ref('—');
const usageEmail = ref('');
const tplOpen = ref(false);
const genOpen = ref(false);
const codeOpen = ref(false);
const tpl = reactive({ id: null, name: '', type: '1', status: '1', plan_id: '', days: '30', balance: '0', theme_color: '#1890ff', description: '', sort: 0 });
const gen = reactive({ template_id: '', count: '10', max_usage: '1', batch_id: '' });
const codeForm = reactive({ id: null, max_usage: '1', batch_id: '' });

const templateColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '名称' },
  { key: 'type', label: '类型' },
  { key: 'status', label: '状态' }
];
const codeColumns = [
  { key: 'code', label: '卡密' },
  { key: 'status', label: '状态' },
  { key: 'max_usage', label: '次数' },
  { key: 'batch_id', label: '批次' }
];
const usageColumns = [
  { key: 'code', label: '卡密', format: (row) => textOf(row.code || row.gift_card_code) },
  { key: 'user_email', label: '用户', format: (row) => textOf(row.user_email || row.email) },
  { key: 'created_at', label: '时间', format: (row) => formatUnix(row.created_at) }
];

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }

async function loadUsages() {
  const filter = usageEmail.value.trim() ? [{ id: 'user_email', value: usageEmail.value.trim() }] : [];
  usages.value = extractRows(await fetchGiftUsages(listBody(filter)));
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    templates.value = extractRows(await fetchGiftTemplates());
    codes.value = extractRows(await fetchGiftCodes(listBody()));
    await loadUsages();
    statsText.value = JSON.stringify(extractData(await fetchGiftStatistics()), null, 2);
  } catch (e) {
    error.value = adminErrorMessage(e, t('admin.failed'));
  } finally {
    loading.value = false;
  }
}

function openTemplate(row) {
  if (!row) {
    Object.assign(tpl, { id: null, name: '', type: '1', status: '1', plan_id: '', days: '30', balance: '0', theme_color: '#1890ff', description: '', sort: 0 });
  } else {
    const rewards = row.rewards || {};
    Object.assign(tpl, {
      id: row.id, name: row.name || '', type: String(row.type ?? 1), status: String(row.status ?? 1),
      plan_id: rewards.plan_id ?? '', days: rewards.plan_validity_days ?? '', balance: rewards.balance ? String(Number(rewards.balance) / 100) : '0',
      theme_color: row.theme_color || '#1890ff', description: row.description || '', sort: row.sort || 0
    });
  }
  tplOpen.value = true;
}

async function saveTemplate() {
  const rewards = {};
  if (tpl.plan_id) rewards.plan_id = Number(tpl.plan_id);
  if (tpl.days) rewards.plan_validity_days = Number(tpl.days);
  if (tpl.balance && Number(tpl.balance)) rewards.balance = centFromYuan(tpl.balance);
  const body = {
    name: tpl.name.trim(), type: Number(tpl.type), status: Number(tpl.status), rewards,
    conditions: {}, limits: {}, special_config: {}, description: tpl.description, theme_color: tpl.theme_color, sort: Number(tpl.sort || 0)
  };
  try {
    if (tpl.id) await updateGiftTemplate({ id: tpl.id, ...body });
    else await createGiftTemplate(body);
    tplOpen.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

async function toggleTemplate(row) {
  try {
    await updateGiftTemplate({ id: row.id, status: Number(row.status) === 1 ? 0 : 1 });
    await load();
  } catch (e) { fail(e); }
}

async function removeTemplate(row) {
  try { await deleteGiftTemplate(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); }
}

async function generate() {
  try {
    const res = await generateGiftCodes({
      template_id: Number(gen.template_id),
      count: Number(gen.count),
      max_usage: Number(gen.max_usage),
      batch_id: gen.batch_id || undefined,
      metadata: null
    });
    const created = extractData(res);
    showToast(created && created.codes ? `已生成 ${created.codes.length}` : t('admin.saved'), 'success');
    genOpen.value = false;
    tab.value = 'codes';
    await load();
  } catch (e) { fail(e); }
}

function openCode(row) {
  codeForm.id = row.id;
  codeForm.max_usage = String(row.max_usage ?? 1);
  codeForm.batch_id = row.batch_id || '';
  codeOpen.value = true;
}

async function saveCode() {
  try {
    await updateGiftCode({ id: codeForm.id, max_usage: Number(codeForm.max_usage), batch_id: codeForm.batch_id });
    codeOpen.value = false;
    await load();
  } catch (e) { fail(e); }
}

async function toggleCode(row) {
  try { await toggleGiftCode(row.id); await load(); } catch (e) { fail(e); }
}

async function removeCode(row) {
  try { await deleteGiftCode(row.id); await load(); } catch (e) { fail(e); }
}

async function exportCodes() {
  try { await saveBlobOrThrow(await exportGiftCodes(), 'gift-codes.csv'); } catch (e) { fail(e); }
}

onMounted(load);
</script>
