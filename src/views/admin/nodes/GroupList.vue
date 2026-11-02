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
    <AdminDialog :show="open" :title="form.id ? t('admin.edit') : t('admin.create')" @close="open = false">
      <div class="form-group"><label class="form-label">名称</label><input v-model="form.name" class="form-control" /></div>
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
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractRows } from '@/api/admin/http';
import { dropServerGroup, fetchServerGroups, saveServerGroup } from '@/api/admin/server';

const { t } = useI18n();
const { showToast } = useToast();
const rows = ref([]);
const open = ref(false);
const form = reactive({ id: null, name: '' });
const columns = [{ key: 'id', label: 'ID' }, { key: 'name', label: '名称' }];

async function load() {
  rows.value = extractRows(await fetchServerGroups());
}
function openCreate() { form.id = null; form.name = ''; open.value = true; }
function openEdit(row) { form.id = row.id; form.name = row.name || ''; open.value = true; }
async function submit() {
  try {
    const body = { name: form.name.trim() };
    if (form.id) body.id = form.id;
    await saveServerGroup(body);
    open.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
}
async function remove(row) {
  try {
    await dropServerGroup(row.id);
    showToast(t('admin.deleted'), 'success');
    await load();
  } catch (e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
}
onMounted(load);
</script>
