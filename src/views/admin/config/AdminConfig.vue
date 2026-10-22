<template>
  <AdminFrame :title="t('admin.config.title')" :description="t('admin.config.description')" :loading="loading" :error="error" @retry="load">
    <div class="subtabs">
      <button v-for="item in CONFIG_MODULES" :key="item.id" class="subtab" :class="{ active: current === item.id }" type="button" @click="switchModule(item.id)">
        {{ t(`admin.config.${item.id}`) }}
      </button>
    </div>
    <div class="dashboard-card">
      <div v-for="field in fields" :key="field.key" class="form-group">
        <label class="form-label">{{ field.key }}</label>
        <textarea v-if="field.kind === 'json'" v-model="field.value" class="form-control" rows="4"></textarea>
        <label v-else-if="field.kind === 'bool'" class="check-line">
          <input v-model="field.value" type="checkbox" />
          {{ field.value ? '1' : '0' }}
        </label>
        <input v-else v-model="field.value" class="form-control" />
      </div>
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
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractData } from '@/api/admin/http';
import { CONFIG_MODULES, fetchConfigModule, saveConfigModule, testSendMail } from '@/api/admin/config';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const current = ref('site');
const fields = ref([]);
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

function toFields(record) {
  return Object.keys(record).map((key) => {
    const value = record[key];
    if (typeof value === 'boolean') {
      return { key, kind: 'bool', value };
    }
    if (value && typeof value === 'object') {
      return { key, kind: 'json', value: JSON.stringify(value, null, 2) };
    }
    return { key, kind: 'text', value: value == null ? '' : String(value) };
  });
}

function toPayload() {
  const body = {};
  fields.value.forEach((field) => {
    if (field.kind === 'bool') body[field.key] = field.value ? 1 : 0;
    else if (field.kind === 'json') {
      try { body[field.key] = field.value.trim() ? JSON.parse(field.value) : {}; }
      catch (e) { throw new Error(`${field.key} 不是合法 JSON`); }
    } else if (field.value !== '' && !Number.isNaN(Number(field.value)) && /^-?\d+(\.\d+)?$/.test(String(field.value).trim())) {
      body[field.key] = Number(field.value);
    } else {
      body[field.key] = field.value;
    }
  });
  return body;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const meta = moduleOf(current.value);
    const res = await fetchConfigModule(meta.fetchKey);
    fields.value = toFields(unwrap(res, meta.dataKey));
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
    await saveConfigModule(meta.write, toPayload());
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
