<template>
  <AdminFrame :title="t('admin.users.title')" :description="t('admin.users.description')" :loading="loading" :error="error" @retry="load">
    <template #tools>
      <button class="action-button" type="button" @click="generateOpen = true">{{ t('admin.users.generate') }}</button>
      <button class="action-button" type="button" @click="exportCsv">{{ t('admin.users.export') }}</button>
    </template>
    <div class="filter-grid">
      <div class="form-group"><input v-model="email" class="form-control" placeholder="email" /></div>
      <div class="form-group"><input v-model="inviteId" class="form-control" placeholder="invite_user_id" /></div>
      <div class="form-group"><button class="btn btn-primary" type="button" @click="load">{{ t('admin.search') }}</button></div>
    </div>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button" type="button" @click="toggleBan(row)">{{ flagOn(row.banned) ? t('admin.users.unban') : t('admin.users.ban') }}</button>
        <button class="action-button" type="button" @click="askReset(row)">{{ t('admin.users.resetSecret') }}</button>
        <button class="action-button" type="button" @click="askTraffic(row)">{{ t('admin.users.resetTraffic') }}</button>
        <button class="action-button" type="button" @click="openMail(row)">{{ t('admin.users.mail') }}</button>
        <button class="action-button" type="button" @click="copySubscribe(row)">{{ t('admin.users.copySubscribe') }}</button>
        <button class="action-button" type="button" @click="goOrders(row)">{{ t('admin.users.theirOrders') }}</button>
        <button class="action-button" type="button" @click="goTraffic(row)">{{ t('admin.users.theirTraffic') }}</button>
        <button class="action-button danger" type="button" @click="askDelete(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>

    <AdminDialog :show="editOpen" :title="t('admin.edit')" @close="editOpen = false">
      <div class="form-group"><label class="form-label">邮箱</label><input v-model="edit.email" class="form-control" /></div>
      <div class="form-group"><label class="form-label">余额（元）</label><input v-model="edit.balance" class="form-control" /></div>
      <div class="form-group"><label class="form-label">邀请人 ID</label><input v-model="edit.invite" class="form-control" /></div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="editOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="saveEdit">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>

    <AdminDialog :show="mailOpen" :title="t('admin.users.mail')" @close="mailOpen = false">
      <div class="form-group"><label class="form-label">主题</label><input v-model="mail.subject" class="form-control" /></div>
      <div class="form-group"><label class="form-label">内容</label><textarea v-model="mail.content" class="form-control" rows="4"></textarea></div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="mailOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="sendMail">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>

    <AdminDialog :show="generateOpen" :title="t('admin.users.generate')" @close="generateOpen = false">
      <div class="form-group"><label class="form-label">邮箱，一行一个，最多 20 个</label><textarea v-model="generateEmails" class="form-control" rows="5"></textarea></div>
      <div class="form-group"><label class="form-label">统一密码（可空）</label><input v-model="generatePassword" class="form-control" /></div>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="generateOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="generate">{{ t('admin.save') }}</button>
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
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractRows, saveBlobOrThrow } from '@/api/admin/http';
import { banAdminUser, destroyAdminUser, dumpAdminUsersCsv, fetchAdminUsers, generateAdminUsers, resetAdminUserSecret, sendAdminMail, setInviteUser, updateAdminUser } from '@/api/admin/user';
import { resetUserTraffic } from '@/api/admin/traffic';
import { centFromYuan, flagOn, formatUnix, yuanFromCent } from '@/utils/adminFormat';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const loading = ref(true);
const error = ref('');
const rows = ref([]);
const email = ref('');
const inviteId = ref('');
const editOpen = ref(false);
const edit = reactive({ id: null, email: '', balance: '', invite: '', prevInvite: '' });
const mailOpen = ref(false);
const mail = reactive({ id: null, subject: '', content: '' });
const generateOpen = ref(false);
const generateEmails = ref('');
const generatePassword = ref('');
const pending = ref(null);

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'email', label: '邮箱' },
  { key: 'balance', label: '余额', format: (row) => `¥${yuanFromCent(row.balance)}` },
  { key: 'banned', label: '状态', format: (row) => (flagOn(row.banned) ? '封禁' : '正常') },
  { key: 'expired_at', label: '到期', format: (row) => formatUnix(row.expired_at) }
];

function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const filter = [];
    if (email.value.trim()) filter.push({ id: 'email', value: email.value.trim() });
    if (inviteId.value) filter.push({ id: 'invite_user_id', value: inviteId.value });
    rows.value = extractRows(await fetchAdminUsers(filter));
  } catch (e) {
    error.value = adminErrorMessage(e, t('admin.failed'));
  } finally {
    loading.value = false;
  }
}

function openEdit(row) {
  edit.id = row.id;
  edit.email = row.email || '';
  edit.balance = (Number(row.balance || 0) / 100).toString();
  edit.invite = row.invite_user_id == null ? '' : String(row.invite_user_id);
  edit.prevInvite = edit.invite;
  editOpen.value = true;
}

async function saveEdit() {
  try {
    await updateAdminUser({ id: edit.id, email: edit.email.trim(), balance: centFromYuan(edit.balance) });
    if (edit.invite !== edit.prevInvite) {
      await setInviteUser({ id: edit.id, invite_user_id: edit.invite.trim() ? Number(edit.invite) : null });
    }
    editOpen.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

function ask(text, run) { pending.value = { text, run }; }
async function runPending() {
  const job = pending.value;
  pending.value = null;
  if (job) await job.run();
}

async function toggleBan(row) {
  try {
    await banAdminUser({ id: row.id, banned: flagOn(row.banned) ? 0 : 1 });
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

function askReset(row) {
  ask('重置该用户的订阅密钥？', async () => {
    try { await resetAdminUserSecret(row.id); showToast(t('admin.saved'), 'success'); } catch (e) { fail(e); }
  });
}

function askTraffic(row) {
  ask('重置该用户流量？', async () => {
    try { await resetUserTraffic(row.id); showToast(t('admin.saved'), 'success'); } catch (e) { fail(e); }
  });
}

function askDelete(row) {
  ask(`永久删除 ${row.email}？`, async () => {
    try { await destroyAdminUser(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); }
  });
}

function openMail(row) {
  mail.id = row.id;
  mail.subject = '';
  mail.content = '';
  mailOpen.value = true;
}

async function sendMail() {
  try {
    await sendAdminMail({ id: mail.id, subject: mail.subject, content: mail.content });
    mailOpen.value = false;
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}

async function exportCsv() {
  try {
    const blob = await dumpAdminUsersCsv();
    await saveBlobOrThrow(blob, 'users.csv');
  } catch (e) { fail(e); }
}

async function generate() {
  const users = generateEmails.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 20).map((item) => (
    generatePassword.value.trim() ? { email: item, password: generatePassword.value.trim() } : { email: item }
  ));
  if (!users.length) return;
  try {
    await generateAdminUsers(users);
    generateOpen.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}

async function copySubscribe(row) {
  const direct = row.subscribe_url;
  const token = row.token;
  const url = direct || (token ? `${window.location.origin}/api/v1/client/subscribe?token=${encodeURIComponent(token)}` : '');
  if (!url) { showToast(t('admin.failed'), 'error'); return; }
  try {
    await navigator.clipboard.writeText(url);
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}

function goOrders(row) {
  router.push({ path: '/admin/orders', query: { user_id: row.id, user_label: row.email } });
}

function goTraffic(row) {
  router.push({ path: '/admin/traffic', query: { user_id: row.id, user_label: row.email } });
}

onMounted(() => {
  if (route.query.invite_user_id) inviteId.value = String(route.query.invite_user_id);
  load();
});
</script>
