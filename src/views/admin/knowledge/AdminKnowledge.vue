<template>
  <AdminFrame :title="t('admin.knowledge.title')" :description="t('admin.knowledge.description')" :loading="loading" :error="error" @retry="load">
    <template #tools>
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
      <button class="action-button" type="button" @click="saveSort">排序</button>
    </template>
    <div class="filter-grid">
      <div class="form-group">
        <select v-model="category" class="form-control">
          <option value="">全部分类</option>
          <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
    </div>
    <AdminTable :rows="filtered" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button" type="button" @click="toggle(row)">{{ flagOn(row.show) ? t('admin.hide') : t('admin.show') }}</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>
    <AdminDialog :show="open" :title="form.id ? t('admin.edit') : t('admin.create')" wide @close="open = false">
      <div class="filter-grid">
        <div class="form-group"><label class="form-label">标题</label><input v-model="form.title" class="form-control" /></div>
        <div class="form-group"><label class="form-label">分类</label><input v-model="form.category" class="form-control" /></div>
        <div class="form-group"><label class="form-label">语言</label><input v-model="form.language" class="form-control" /></div>
        <div class="form-group"><label class="form-label">排序</label><input v-model="form.sort" class="form-control" /></div>
      </div>
      <div class="form-group"><label class="form-label">正文</label><textarea v-model="form.body" class="form-control" rows="8"></textarea></div>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractData, extractRows } from '@/api/admin/http';
import { createAdminKnowledge, deleteAdminKnowledge, fetchAdminKnowledge, fetchAdminKnowledgeCategories, showAdminKnowledge, sortAdminKnowledge, updateAdminKnowledge } from '@/api/admin/knowledge';
import { flagOn } from '@/utils/adminFormat';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const rows = ref([]);
const categories = ref([]);
const category = ref('');
const open = ref(false);
const pending = ref(null);
const form = reactive({ id: null, title: '', body: '', category: '', language: 'zh-CN', show: true, sort: 0, automatic_translation: false });
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: '标题' },
  { key: 'category', label: '分类' },
  { key: 'show', label: '显示', format: (row) => (flagOn(row.show) ? '是' : '否') },
  { key: 'sort', label: '排序' }
];
const filtered = computed(() => rows.value.filter((row) => !category.value || row.category === category.value));

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
function namesFrom(payload) {
  const data = extractData(payload);
  const list = Array.isArray(data) ? data : extractRows(payload);
  return list.map((item) => (typeof item === 'string' ? item : item.name || item.category)).filter(Boolean);
}
async function load() {
  loading.value = true;
  error.value = '';
  try {
    rows.value = extractRows(await fetchAdminKnowledge());
    categories.value = namesFrom(await fetchAdminKnowledgeCategories());
  } catch (e) { error.value = adminErrorMessage(e, t('admin.failed')); }
  finally { loading.value = false; }
}
function openCreate() {
  Object.assign(form, { id: null, title: '', body: '', category: '', language: 'zh-CN', show: true, sort: 0, automatic_translation: false });
  open.value = true;
}
function openEdit(row) {
  Object.assign(form, {
    id: row.id, title: row.title || '', body: row.body || row.content || '', category: row.category || '',
    language: row.language || 'zh-CN', show: flagOn(row.show), sort: row.sort || 0, automatic_translation: false
  });
  open.value = true;
}
async function submit() {
  const payload = {
    language: form.language, title: form.title.trim(), body: form.body, category: form.category,
    show: form.show ? 1 : 0, sort: Number(form.sort || 0)
  };
  if (form.automatic_translation) payload.automatic_translation = true;
  if (form.id) payload.id = form.id;
  try {
    if (form.id) await updateAdminKnowledge(payload);
    else await createAdminKnowledge(payload);
    open.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}
async function toggle(row) {
  try { await showAdminKnowledge(row.id, flagOn(row.show) ? 0 : 1); await load(); } catch (e) { fail(e); }
}
function remove(row) {
  pending.value = { text: '删除该文章？', run: async () => { try { await deleteAdminKnowledge(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); } } };
}
async function runPending() { const job = pending.value; pending.value = null; if (job) await job.run(); }
async function saveSort() {
  try {
    await sortAdminKnowledge([...rows.value].sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)).map((row) => row.id));
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}
onMounted(load);
</script>
