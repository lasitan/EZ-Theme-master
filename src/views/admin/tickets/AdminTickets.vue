<template>
  <AdminFrame :title="t('admin.tickets.title')" :description="t('admin.tickets.description')" :loading="loading" :error="error" @retry="load">
    <div class="subtabs">
      <button class="subtab" :class="{ active: status === 0 }" type="button" @click="switchStatus(0)">{{ t('admin.tickets.open') }}</button>
      <button class="subtab" :class="{ active: status === 1 }" type="button" @click="switchStatus(1)">{{ t('admin.tickets.closed') }}</button>
    </div>
    <div class="filter-grid">
      <div class="form-group"><input v-model="subject" class="form-control" placeholder="主题" /></div>
      <div class="form-group"><button class="btn btn-primary" type="button" @click="load">{{ t('admin.search') }}</button></div>
    </div>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openDetail(row)">{{ t('admin.orders.detail') }}</button>
      </template>
    </AdminTable>

    <AdminDialog :show="open" :title="active.subject || t('admin.tickets.title')" wide @close="open = false">
      <div class="thread">
        <div v-for="(msg, index) in messages" :key="index" class="bubble" :class="isAdminMessage(msg) ? 'admin' : 'user'">
          <div class="muted">{{ isAdminMessage(msg) ? '客服' : '用户' }}</div>
          <div>{{ messageText(msg) }}</div>
        </div>
      </div>
      <div v-if="status === 0" class="form-group" style="margin-top: 16px">
        <textarea v-model="reply" class="form-control" rows="3" :placeholder="t('admin.tickets.reply')"></textarea>
      </div>
      <template #footer>
        <button v-if="status === 0" class="dialog-btn dialog-btn-cancel" type="button" @click="closeTicket">{{ t('admin.tickets.close') }}</button>
        <button v-if="status === 0" class="dialog-btn dialog-btn-confirm" type="button" @click="sendReply">{{ t('admin.tickets.reply') }}</button>
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
import { closeAdminTicket, fetchAdminTicketDetail, fetchAdminTickets, replyAdminTicket } from '@/api/admin/ticket';
import { formatUnix, textOf } from '@/utils/adminFormat';

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const rows = ref([]);
const status = ref(0);
const subject = ref('');
const open = ref(false);
const active = ref({});
const messages = ref([]);
const reply = ref('');
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'subject', label: '主题' },
  { key: 'level', label: '等级' },
  { key: 'updated_at', label: '更新', format: (row) => formatUnix(row.updated_at || row.created_at) }
];

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
function isAdminMessage(msg) {
  const sender = String(msg.sender_type || msg.senderType || '').toLowerCase();
  if (sender === 'admin') return true;
  if (sender === 'user') return false;
  return msg.is_me === true || msg.is_from_admin === true || Number(msg.user_id) === 0;
}
function messageText(msg) { return textOf(msg.message || msg.content || msg.body); }

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const filter = subject.value.trim() ? [{ id: 'subject', value: subject.value.trim() }] : [];
    rows.value = extractRows(await fetchAdminTickets({ status: status.value, filter, sort: [{ id: 'updated_at', order: 'desc' }] }));
  } catch (e) { error.value = adminErrorMessage(e, t('admin.failed')); }
  finally { loading.value = false; }
}

async function switchStatus(next) {
  status.value = next;
  await load();
}

async function openDetail(row) {
  open.value = true;
  active.value = row;
  reply.value = '';
  try {
    const data = extractData(await fetchAdminTicketDetail(row.id)) || {};
    const ticket = data.id ? data : (data.data || data.ticket || row);
    active.value = ticket;
    const list = ticket.messages || ticket.message || [];
    messages.value = Array.isArray(list) ? list : [];
  } catch (e) { fail(e); }
}

async function sendReply() {
  if (!reply.value.trim()) return;
  try {
    await replyAdminTicket(active.value.id, reply.value.trim());
    reply.value = '';
    showToast(t('admin.saved'), 'success');
    await openDetail(active.value);
  } catch (e) { fail(e); }
}

async function closeTicket() {
  try {
    await closeAdminTicket(active.value.id);
    open.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

onMounted(load);
</script>
