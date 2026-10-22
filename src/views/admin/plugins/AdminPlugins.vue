<template>
  <AdminFrame :title="t('admin.plugins.title')" :description="t('admin.plugins.description')" :loading="loading" :error="error" @retry="load">
    <template #tools>
      <button class="action-button" type="button" @click="scan">{{ t('admin.plugins.scan') }}</button>
      <button class="action-button" type="button" @click="discover">{{ t('admin.plugins.discover') }}</button>
      <button class="action-button" type="button" @click="reload">{{ t('admin.plugins.reload') }}</button>
      <label class="action-button">
        {{ t('admin.plugins.upload') }}
        <input ref="folderInput" type="file" webkitdirectory multiple hidden @change="upload" />
      </label>
    </template>
    <p v-if="discoveredText" class="muted" style="margin-bottom: 12px">{{ discoveredText }}</p>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="toggle(row)">{{ row.is_enabled ? t('admin.disable') : t('admin.enable') }}</button>
        <button class="action-button" type="button" @click="openConfig(row)">{{ t('admin.plugins.config') }}</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>
    <AdminDialog :show="configOpen" :title="t('admin.plugins.config')" wide @close="configOpen = false">
      <textarea v-model="configText" class="form-control" rows="12"></textarea>
      <label class="check-line"><input v-model="removeFiles" type="checkbox" /> 删除时移除文件</label>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="configOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="saveConfig">{{ t('admin.save') }}</button>
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
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractData, extractRows } from '@/api/admin/http';
import { deletePlugin, disablePlugin, discoverPlugins, enablePlugin, fetchPluginConfig, fetchPlugins, reloadPlugins, savePluginConfig, scanPlugins, uploadPluginFolder } from '@/api/admin/plugin';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const rows = ref([]);
const discoveredText = ref('');
const configOpen = ref(false);
const configText = ref('{}');
const active = ref(null);
const removeFiles = ref(false);
const pending = ref(null);
const columns = [
  { key: 'code', label: '代码' },
  { key: 'name', label: '名称' },
  { key: 'version', label: '版本' },
  { key: 'type', label: '类型' },
  { key: 'is_enabled', label: '状态', format: (row) => (row.is_enabled ? '运行中' : '已禁用') }
];

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
function normalize(row) {
  return { ...row, is_enabled: row.is_enabled === true || row.is_enabled === 1 || row.is_enabled === '1' };
}
async function load() {
  loading.value = true;
  error.value = '';
  try { rows.value = extractRows(await fetchPlugins()).map(normalize); }
  catch (e) { error.value = adminErrorMessage(e, t('admin.failed')); }
  finally { loading.value = false; }
}
async function scan() {
  try {
    const data = extractData(await scanPlugins()) || {};
    discoveredText.value = `扫描 ${data.scanned || 0}，发现 ${(data.discovered || []).length}`;
    await load();
  } catch (e) { fail(e); }
}
async function discover() {
  try {
    const data = extractData(await discoverPlugins()) || {};
    const list = data.discovered || [];
    discoveredText.value = list.map((item) => item.code || item.name).join('、') || t('admin.empty');
  } catch (e) { fail(e); }
}
async function reload() {
  try { await reloadPlugins(); showToast(t('admin.saved'), 'success'); await load(); } catch (e) { fail(e); }
}
async function upload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  try {
    await uploadPluginFolder(files, { overwrite: true, autoEnable: false });
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
  event.target.value = '';
}
async function toggle(row) {
  try {
    const body = { id: row.id, code: row.code };
    if (row.is_enabled) await disablePlugin(body);
    else await enablePlugin(body);
    await load();
  } catch (e) { fail(e); }
}
async function openConfig(row) {
  active.value = row;
  removeFiles.value = false;
  try {
    const data = extractData(await fetchPluginConfig(row.id ? { id: row.id } : { code: row.code })) || {};
    const plugin = data.plugin || data;
    configText.value = JSON.stringify(plugin.config || row.config || {}, null, 2);
    configOpen.value = true;
  } catch (e) { fail(e); }
}
async function saveConfig() {
  try {
    const config = JSON.parse(configText.value || '{}');
    await savePluginConfig({ id: active.value.id, code: active.value.code, config });
    configOpen.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}
function remove(row) {
  pending.value = {
    text: `删除插件 ${row.name || row.code}？`,
    run: async () => {
      try {
        await deletePlugin({ id: row.id, code: row.code, remove_files: removeFiles.value });
        showToast(t('admin.deleted'), 'success');
        await load();
      } catch (e) { fail(e); }
    }
  };
}
async function runPending() { const job = pending.value; pending.value = null; if (job) await job.run(); }
onMounted(load);
</script>
