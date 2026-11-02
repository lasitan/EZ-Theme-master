<template>
  <div>
    <div class="toolbar">
      <button class="action-button" type="button" @click="openCreate">{{ t('admin.create') }}</button>
    </div>
    <AdminTable :rows="rows" :columns="columns">
      <template #actions="{ row }">
        <button class="action-button" type="button" @click="openEdit(row)">{{ t('admin.edit') }}</button>
        <button class="action-button" type="button" @click="openOps(row)">运维</button>
        <button class="action-button danger" type="button" @click="remove(row)">{{ t('admin.delete') }}</button>
      </template>
    </AdminTable>

    <AdminDialog :show="editOpen" :title="form.id ? t('admin.edit') : t('admin.create')" wide @close="editOpen = false">
      <div class="filter-grid">
        <div class="form-group"><label class="form-label">名称</label><input v-model="form.name" class="form-control" /></div>
        <div class="form-group">
          <label class="form-label">DNS 主机名 <InfoTip text="这台机器对外使用的域名。" /></label>
          <input v-model="form.dns_hostname" class="form-control" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">UDP <InfoTip text="一行一个地址。" /></label>
        <textarea v-model="form.udp" class="form-control" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">TCP <InfoTip text="一行一个地址。" /></label>
        <textarea v-model="form.tcp" class="form-control" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">DoH <InfoTip text="一行一个地址。" /></label>
        <textarea v-model="form.doh" class="form-control" rows="3"></textarea>
      </div>
      <label class="check-line"><input v-model="form.is_active" type="checkbox" /> 启用</label>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="editOpen = false">{{ t('admin.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" type="button" @click="submit">{{ t('admin.save') }}</button>
      </template>
    </AdminDialog>

    <AdminDialog :show="opsOpen" title="运维" wide @close="opsOpen = false">
      <div class="filter-grid">
        <div class="form-group">
          <label class="form-label">模式</label>
          <select v-model="ops.mode" class="form-control">
            <option value="normal">正常</option>
            <option value="drain">排水</option>
            <option value="maintenance">维护</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">日志级别</label>
          <select v-model="ops.log_level" class="form-control">
            <option value="debug">调试</option>
            <option value="info">信息</option>
            <option value="warn">警告</option>
            <option value="error">错误</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">节点动作</label>
          <select v-model="ops.action" class="form-control">
            <option value="start">启动</option>
            <option value="stop">停止</option>
            <option value="reload">热重载</option>
            <option value="restart">重启</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">节点</label>
        <select v-model="ops.node_ids" class="form-control" multiple>
          <option v-for="item in machineNodes" :key="item.id" :value="String(item.id)">{{ item.name || item.id }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">用户编号 <InfoTip text="一行一个，用于踢下线、封禁和限速。" /></label>
        <textarea v-model="ops.user_ids" class="form-control" rows="3"></textarea>
      </div>
      <div class="filter-grid">
        <div class="form-group"><label class="form-label">限速</label><input v-model="ops.speed_limit" class="form-control" /></div>
        <div class="form-group"><label class="form-label">设备数</label><input v-model="ops.device_limit" class="form-control" /></div>
      </div>
      <div class="toolbar">
        <button class="action-button" type="button" @click="runMode">保存模式</button>
        <button class="action-button" type="button" @click="runLogLevel">保存日志</button>
        <button class="action-button" type="button" @click="runNodeControl">执行节点动作</button>
        <button class="action-button" type="button" @click="run('restart')">整机重启</button>
        <button class="action-button" type="button" @click="run('reload_cert')">重载证书</button>
        <button class="action-button" type="button" @click="runPush('snapshot')">重推配置</button>
        <button class="action-button" type="button" @click="runPush('policy')">重推策略</button>
        <button class="action-button" type="button" @click="runPush('dns')">推送 DNS</button>
        <button class="action-button" type="button" @click="runPush('users')">推送用户</button>
        <button class="action-button" type="button" @click="runKick">踢下线</button>
        <button class="action-button" type="button" @click="runBan">同步封禁</button>
        <button class="action-button" type="button" @click="runLimits">应用限速</button>
        <button class="action-button" type="button" @click="showInstall">安装命令</button>
        <button class="action-button" type="button" @click="showToken">查看令牌</button>
        <button class="action-button" type="button" @click="resetToken">重置令牌</button>
        <button class="action-button" type="button" @click="showStatus">查看状态</button>
        <button class="action-button" type="button" @click="showLogs">查看日志</button>
      </div>
      <div v-if="resultRows.length" class="kv">
        <template v-for="(row, index) in resultRows" :key="index">
          <span>{{ row.label }}</span>
          <span>{{ row.value }}</span>
        </template>
      </div>
      <pre v-if="resultText" class="pre-block">{{ resultText }}</pre>
      <template #footer>
        <button class="dialog-btn dialog-btn-cancel" type="button" @click="opsOpen = false">{{ t('admin.cancel') }}</button>
      </template>
    </AdminDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminTable from '@/components/admin/AdminTable.vue';
import AdminDialog from '@/components/admin/AdminDialog.vue';
import InfoTip from '@/components/admin/InfoTip.vue';
import { useToast } from '@/composables/useToast';
import { adminErrorMessage, extractData, extractRows } from '@/api/admin/http';
import { banMachineUsers, controlMachineNodes, dropMachine, fetchInstallCommand, fetchMachineLogs, fetchMachineNodes, fetchMachineToken, fetchMachines, kickMachineUsers, limitMachineUsers, machineCommand, overrideMachineDns, pushMachineDns, pushMachineNodeConfig, pushMachinePolicy, pushMachineSnapshot, pushMachineUsers, queryMachineMetrics, queryMachineStatus, resetMachineToken, saveMachine, setMachineLogLevel, setMachineMode } from '@/api/admin/server';
import { flagOn } from '@/utils/adminFormat';
import { readableRows } from '@/utils/recordFields';

const { t } = useI18n();
const { showToast } = useToast();
const rows = ref([]);
const editOpen = ref(false);
const opsOpen = ref(false);
const machineNodes = ref([]);
const resultRows = ref([]);
const resultText = ref('');
const form = reactive({ id: null, name: '', dns_hostname: '', udp: '', tcp: '', doh: '', is_active: true });
const ops = reactive({ id: null, mode: 'normal', log_level: 'info', action: 'reload', node_ids: [], user_ids: '', speed_limit: '', device_limit: '' });
const columns = [
  { key: 'name', label: '名称' },
  { key: 'online', label: '在线', format: (row) => (flagOn(row.online) ? '在线' : '离线') },
  { key: 'mode', label: '模式', format: (row) => ({ normal: '正常', drain: '排水', maintenance: '维护' }[row.mode] || row.mode || '—') },
  { key: 'config_revision', label: '版本' },
  { key: 'public_ip', label: '公网 IP' },
  { key: 'dns_hostname', label: 'DNS 主机名' }
];

function lines(text) { return String(text || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean); }
function join(list) { return Array.isArray(list) ? list.join('\n') : ''; }
function dnsOf(row) {
  const dns = row.dns_config || {};
  return { udp: join(dns.udp), tcp: join(dns.tcp), doh: join(dns.doh) };
}
function dnsBody() {
  return { udp: lines(form.udp), tcp: lines(form.tcp), doh: lines(form.doh) };
}
function userIds() { return lines(ops.user_ids).map(Number).filter((n) => Number.isFinite(n)); }
function nodeIds() { return ops.node_ids.map(Number).filter((n) => Number.isFinite(n)); }
function fail(e) { showToast(adminErrorMessage(e, t('admin.failed')), 'error'); }
function showResult(payload) {
  const data = extractData(payload);
  resultText.value = '';
  resultRows.value = readableRows(data && data.payload ? data.payload : data);
}
async function load() { rows.value = extractRows(await fetchMachines()); }
function openCreate() {
  Object.assign(form, { id: null, name: '', dns_hostname: '', udp: '1.1.1.1:53', tcp: '', doh: '', is_active: true });
  editOpen.value = true;
}
function openEdit(row) {
  const dns = dnsOf(row);
  Object.assign(form, { id: row.id, name: row.name || '', dns_hostname: row.dns_hostname || '', ...dns, is_active: flagOn(row.is_active) });
  editOpen.value = true;
}
async function openOps(row) {
  Object.assign(ops, { id: row.id, mode: row.mode || 'normal', log_level: row.log_level || 'info', action: 'reload', node_ids: [], user_ids: '', speed_limit: '', device_limit: '' });
  resultRows.value = [];
  resultText.value = '';
  try { machineNodes.value = extractRows(await fetchMachineNodes(row.id)); } catch (e) { machineNodes.value = []; }
  opsOpen.value = true;
}
async function submit() {
  try {
    const body = { name: form.name.trim(), is_active: form.is_active ? 1 : 0, dns_hostname: form.dns_hostname.trim(), dns_config: dnsBody() };
    if (form.id) body.id = form.id;
    await saveMachine(body);
    editOpen.value = false;
    showToast(t('admin.saved'), 'success');
    await load();
  } catch (e) { fail(e); }
}
async function remove(row) {
  try { await dropMachine(row.id); showToast(t('admin.deleted'), 'success'); await load(); } catch (e) { fail(e); }
}
async function runMode() {
  try { await setMachineMode(ops.id, ops.mode); showToast(t('admin.saved'), 'success'); await load(); } catch (e) { fail(e); }
}
async function runLogLevel() {
  try { await setMachineLogLevel(ops.id, ops.log_level); showToast(t('admin.saved'), 'success'); } catch (e) { fail(e); }
}
async function runNodeControl() {
  try {
    showResult(await controlMachineNodes(ops.id, ops.action, nodeIds()));
    if (ops.action === 'reload') await pushMachineNodeConfig(ops.id, nodeIds());
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}
async function run(action) {
  try { showResult(await machineCommand(ops.id, action)); showToast(t('admin.saved'), 'success'); } catch (e) { fail(e); }
}
async function runPush(kind) {
  try {
    if (kind === 'snapshot') showResult(await pushMachineSnapshot(ops.id));
    else if (kind === 'policy') showResult(await pushMachinePolicy(ops.id));
    else if (kind === 'users') showResult(await pushMachineUsers(ops.id));
    else {
      await overrideMachineDns(ops.id, dnsBodyFromRow());
      showResult(await pushMachineDns(ops.id));
    }
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}
function dnsBodyFromRow() {
  const row = rows.value.find((item) => item.id === ops.id) || {};
  const dns = row.dns_config || {};
  return { udp: dns.udp || [], tcp: dns.tcp || [], doh: dns.doh || [] };
}
async function runKick() {
  try { showResult(await kickMachineUsers(ops.id, userIds())); showToast(t('admin.saved'), 'success'); } catch (e) { fail(e); }
}
async function runBan() {
  try { showResult(await banMachineUsers(ops.id, userIds(), 1)); showToast(t('admin.saved'), 'success'); } catch (e) { fail(e); }
}
async function runLimits() {
  try {
    showResult(await limitMachineUsers(ops.id, {
      user_ids: userIds(),
      speed_limit: ops.speed_limit === '' ? undefined : Number(ops.speed_limit),
      device_limit: ops.device_limit === '' ? undefined : Number(ops.device_limit)
    }));
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}
function textFrom(payload) {
  const data = extractData(payload);
  if (typeof data === 'string') return data;
  if (!data || typeof data !== 'object') return '';
  return data.command || data.install_command || data.token || data.script || '';
}
async function showInstall() {
  try {
    const text = textFrom(await fetchInstallCommand(ops.id));
    resultRows.value = [];
    resultText.value = text || '没有安装命令';
  } catch (e) { fail(e); }
}
async function showToken() {
  try {
    const text = textFrom(await fetchMachineToken(ops.id));
    resultRows.value = [];
    resultText.value = text || '没有令牌';
  } catch (e) { fail(e); }
}
async function resetToken() {
  try {
    const text = textFrom(await resetMachineToken(ops.id));
    resultRows.value = [];
    resultText.value = text || '已重置';
    showToast(t('admin.saved'), 'success');
  } catch (e) { fail(e); }
}
async function showStatus() {
  try {
    const [status, metrics] = await Promise.all([queryMachineStatus(ops.id), queryMachineMetrics(ops.id).catch(() => null)]);
    const statusData = extractData(status);
    const metricData = metrics ? extractData(metrics) : null;
    resultText.value = '';
    resultRows.value = readableRows({
      ...(statusData && statusData.payload ? statusData.payload : statusData),
      ...(metricData && metricData.payload ? { metrics: metricData.payload } : {})
    });
  } catch (e) { fail(e); }
}
async function showLogs() {
  try {
    const data = extractData(await fetchMachineLogs(ops.id));
    const list = Array.isArray(data) ? data : extractRows(data);
    resultRows.value = [];
    resultText.value = list.map((item) => {
      if (typeof item === 'string') return item;
      return [item.time || item.created_at, item.level, item.message || item.msg].filter(Boolean).join(' ');
    }).join('\n') || '没有日志';
  } catch (e) { fail(e); }
}
onMounted(load);
</script>
