<template>
  <AdminFrame :title="t('admin.config.title')" :description="t('admin.config.description')" :loading="loading" :error="error" @retry="load">
    <div class="subtabs">
      <button v-for="item in CONFIG_MODULES" :key="item.id" class="subtab" :class="{ active: current === item.id }" type="button" @click="switchModule(item.id)">
        {{ t(`admin.config.${item.id}`) }}
      </button>
    </div>
    <div class="dashboard-card">
      <p v-if="current === 'subscribe_template'" class="muted">订阅模板，按 YML 填写。</p>
      <RecordFields v-if="draft" :draft="draft" />
      <button class="btn btn-primary" type="button" @click="save">{{ t('admin.save') }}</button>
    </div>
    <div v-if="current === 'mail'" class="dashboard-card">
      <div class="card-header"><h3 class="card-title">{{ t('admin.config.testMail') }}</h3></div>
      <div class="form-group"><input v-model="testEmail" class="form-control" placeholder="email" /></div>
      <button class="btn btn-secondary" type="button" @click="sendTest">{{ t('admin.config.testMail') }}</button>
    </div>
  </AdminFrame>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import RecordFields from '@/components/admin/RecordFields.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractData } from '@/api/admin/http';
import { CONFIG_MODULES, fetchConfigModule, saveConfigModule, testSendMail } from '@/api/admin/config';
import { fromDraft, toDraft } from '@/utils/recordFields';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const current = ref('site');
const draft = ref(null);
const testEmail = ref('');

function moduleOf(id) {
  return CONFIG_MODULES.find((item) => item.id === id) || CONFIG_MODULES[0];
}

function unwrap(payload, dataKey) {
  const data = extractData(payload);
  if (data && typeof data === 'object' && !Array.isArray(data) && data[dataKey] && typeof data[dataKey] === 'object') {
    return data[dataKey];
  }
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const meta = moduleOf(current.value);
    const res = await fetchConfigModule(meta.fetchKey);
    const record = unwrap(res, meta.dataKey);
    draft.value = toDraft(record, '', { yml: meta.id === 'subscribe_template' });
  } catch (e) {
    error.value = adminErrorMessage(e, t('admin.failed'));
  } finally {
    loading.value = false;
  }
}

async function switchModule(id) {
  current.value = id;
  await load();
}

async function save() {
  try {
    const meta = moduleOf(current.value);
    await saveConfigModule(meta.write, fromDraft(draft.value));
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) {
    showToast(adminErrorMessage(e, t('admin.failed')), 'error');
  }
}

async function sendTest() {
  try {
    await testSendMail(testEmail.value.trim());
    showToast(t('admin.saved'), 'success');
  } catch (e) {
    showToast(adminErrorMessage(e, t('admin.failed')), 'error');
  }
}

onMounted(load);
</script>
