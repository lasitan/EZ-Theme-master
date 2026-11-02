<template>
  <div>
    <div class="toolbar">
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
    </div>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>
    <AdminDialog :show="open" :title="form.id ? t('admin.edit') : t('admin.create')" wide @close="open = false">
      <RecordFields v-if="draft" :draft="draft" />
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="open = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="submit">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import RecordFields from '@/components/admin/RecordFields.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractRows } from '@/api/admin/http';
import { dropServerRoute, fetchServerRoutes, saveServerRoute } from '@/api/admin/server';
import { fromDraft, toDraft } from '@/utils/recordFields';

const { t } = useI18n();
const { showToast } = useToast();
const rows = ref([]);
const open = ref(false);
const draft = ref(null);
const form = reactive({ id: null });
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'remarks', label: '备注', format: (row) => row.remarks || row.name || '—' },
  { key: 'action', label: '动作', format: (row) => row.action || '—' }
];

function editable(row) {
  const copy = { ...(row || { remarks: '', match: [], action: '', action_value: '' }) };
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  return copy;
}

async function load() { rows.value = extractRows(await fetchServerRoutes()); }
function openCreate() { form.id = null; draft.value = toDraft(editable()); open.value = true; }
function openEdit(row) { form.id = row.id; draft.value = toDraft(editable(row)); open.value = true; }
async function submit() {
  try {
    const body = fromDraft(draft.value);
    if (form.id) body.id = form.id;
    await saveServerRoute(body);
    open.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
}
async function remove(row) {
  try { await dropServerRoute(row.id); showToast(t('admin.deleted'), 'success'); await load(); }
  catch (e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
}
onMounted(load);
</script>
