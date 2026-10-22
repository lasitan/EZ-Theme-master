<template>
  <AdminFrame :title="t('admin.notices.title')" :description="t('admin.notices.description')" :loading="loading" :error="error" @retry="load">
    <template #tools>
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
      <button class="action-button" type="button" @click="saveSort">排序</button>
    </template>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button" type="button" @click="toggle(row)">{{ flagOn(row.show) ? t('admin.hide') : t('admin.show') }}</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>
    <AdminDialog :show="open" :title="form.id ? t('admin.edit') : t('admin.create')" wide @close="open = false">
      <div class="form-group"><label class="form-label">标题</label><input v-model="form.title" class="form-control" /></div>
      <div class="form-group"><label class="form-label">语言</label><input v-model="form.language" class="form-control" /></div>
      <div class="form-group"><label class="form-label">图片</label><input v-model="form.img_url" class="form-control" /></div>
      <div class="form-group"><label class="form-label">标签，逗号分隔</label><input v-model="form.tags" class="form-control" /></div>
      <div class="form-group"><label class="form-label">内容</label><textarea v-model="form.content" class="form-control" rows="6"></textarea></div>
      <label class="check-line"><input v-model="form.show" type="checkbox" /> {{ t('admin.show') }}</label>
      <label class="check-line"><input v-model="form.automatic_translation" type="checkbox" /> 自动翻译</label>
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
import { createAdminNotice, deleteAdminNotice, fetchAdminNotices, showAdminNotice, sortAdminNotices, updateAdminNotice } from '@/api/admin/notice';
import { flagOn } from '@/utils/adminFormat';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const rows = ref([]);
const open = ref(false);
const pending = ref(null);
const form = reactive({ id: null, title: '', content: '', language: 'zh-CN', img_url: '', tags: '', show: true, sort: 0, automatic_translation: false });
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: '标题' },
  { key: 'language', label: '语言' },
  { key: 'show', label: '显示', format: (row) => (flagOn(row.show) ? '是' : '否') },
  { key: 'sort', label: '排序' }
];

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
function tagsOf(value) {
  if (Array.isArray(value)) return value;
  return String(value || '').split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}
function body() {
  const payload = {
    language: form.language || 'zh-CN',
    title: form.title.trim(),
    content: form.content,
    show: form.show ? 1 : 0,
    sort: Number(form.sort || 0),
    img_url: form.img_url,
    tags: tagsOf(form.tags)
  };
  if (form.automatic_translation) payload.automatic_translation = true;
  if (form.id) payload.id = form.id;
  return payload;
}
async function load() {
  loading.value = true;
  error.value = '';
  try { rows.value = extractRows(await fetchAdminNotices()); }
  catch (e) { error.value = adminErrorMessage(e, t('admin.failed')); }
  finally { loading.value = false; }
}
function openCreate() {
  Object.assign(form, { id: null, title: '', content: '', language: 'zh-CN', img_url: '', tags: '', show: true, sort: 0, automatic_translation: false });
  open.value = true;
}
function openEdit(row) {
  Object.assign(form, {
    id: row.id, title: row.title || '', content: row.content || '', language: row.language || 'zh-CN',
    img_url: row.img_url || '', tags: Array.isArray(row.tags) ? row.tags.join(',') : (row.tags || ''),
    show: flagOn(row.show), sort: row.sort || 0, automatic_translation: false
  });
  open.value = true;
}
async function submit() {
  try {
    if (form.id) await updateAdminNotice(body());
    else await createAdminNotice(body());
    open.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}
async function toggle(row) {
  try { await showAdminNotice(row.id, flagOn(row.show) ? 0 : 1); await load(); } catch (e) { fail(e); }
}
function remove(row) {
  pending.value = { text: '删除该公告？', run: async () => { try { await deleteAdminNotice(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); } } };
}
async function runPending() { const job = pending.value; pending.value = null; if (job) await job.run(); }
async function saveSort() {
  try {
    const ids = [...rows.value].sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)).map((row) => row.id);
    await sortAdminNotices(ids);
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}
onMounted(load);
</script>
