import { XB } from '../endpoints';
import { adminGet, adminPost } from './http';

export function fetchAdminNodes() {
  return adminGet(XB.admin.server.getNodes);
}

export function fetchProtocolMeta() {
  return adminGet(XB.admin.server.getProtocolMeta);
}

export function fetchServerGroups() {
  return adminGet(XB.admin.server.groupFetch);
}

export function fetchServerRoutes() {
  return adminGet(XB.admin.server.routeFetch);
}

export function saveAdminNode(body) {
  return adminPost(XB.admin.server.save, body);
}

export function updateAdminNode(body) {
  return adminPost(XB.admin.server.update, body);
}

export function copyAdminNode(id) {
  return adminPost(XB.admin.server.copy, { id });
}

export function dropAdminNode(id) {
  return adminPost(XB.admin.server.drop, { id });
}

export function generateEchKey(body) {
  return adminPost(XB.admin.server.generateEchKey, body || {});
}

export function saveServerGroup(body) {
  return adminPost(XB.admin.server.groupSave, body);
}

export function dropServerGroup(id) {
  return adminPost(XB.admin.server.groupDrop, { id });
}

export function saveServerRoute(body) {
  return adminPost(XB.admin.server.routeSave, body);
}

export function dropServerRoute(id) {
  return adminPost(XB.admin.server.routeDrop, { id });
}

export function fetchMachines() {
  return adminGet(XB.admin.server.machineFetch);
}

export function saveMachine(body) {
  return adminPost(XB.admin.server.machineSave, body);
}

export function dropMachine(id) {
  return adminPost(XB.admin.server.machineDrop, { id });
}

export function resetMachineToken(id) {
  return adminPost(XB.admin.server.machineResetToken, { id });
}

export function fetchMachineToken(id) {
  return adminGet(XB.admin.server.machineGetToken, { id });
}

export function fetchInstallCommand(id) {
  return adminGet(XB.admin.server.machineInstallCommand, { id });
}

export function fetchMachineNodes(id) {
  return adminGet(XB.admin.server.machineNodes, { id });
}

export function setMachineMode(machineId, mode) {
  return adminPost(XB.admin.server.machineSetMode, { machine_id: machineId, mode });
}

export function setMachineLogLevel(machineId, logLevel) {
  return adminPost(XB.admin.server.machineSetLogLevel, { machine_id: machineId, log_level: logLevel });
}

export function machineCommand(machineId, action) {
  return adminPost(XB.admin.server.machineCommand, { machine_id: machineId, action });
}

export function pushMachineDns(machineId) {
  return adminPost(XB.admin.server.machineDnsPush, { machine_id: machineId });
}

export function overrideMachineDns(machineId, dnsConfig) {
  return adminPost(XB.admin.server.machineDnsOverride, { machine_id: machineId, dns_config: dnsConfig });
}

export function pushMachineSnapshot(machineId) {
  return adminPost(XB.admin.server.machinePushSnapshot, { machine_id: machineId });
}

export function pushMachinePolicy(machineId) {
  return adminPost(XB.admin.server.machinePushPolicy, { machine_id: machineId });
}

export function controlMachineNodes(machineId, action, nodeIds) {
  return adminPost(XB.admin.server.machineNodeControl, { machine_id: machineId, action, node_ids: nodeIds });
}

export function pushMachineNodeConfig(machineId, nodeIds) {
  return adminPost(XB.admin.server.machineNodeConfigPush, { machine_id: machineId, node_ids: nodeIds });
}

export function pushMachineUsers(machineId) {
  return adminPost(XB.admin.server.machineUsersPush, { machine_id: machineId });
}

export function kickMachineUsers(machineId, userIds) {
  return adminPost(XB.admin.server.machineUserKick, { machine_id: machineId, user_ids: userIds });
}

export function banMachineUsers(machineId, userIds, banned) {
  return adminPost(XB.admin.server.machineUserBan, { machine_id: machineId, user_ids: userIds, banned });
}

export function limitMachineUsers(machineId, body) {
  return adminPost(XB.admin.server.machineUserLimits, { machine_id: machineId, ...body });
}

export function fetchMachineLogs(machineId) {
  return adminGet(XB.admin.server.machineLogFetch, { id: machineId, machine_id: machineId });
}

export function queryMachineStatus(machineId) {
  return adminPost(XB.admin.server.machineQueryStatus, { machine_id: machineId, timeout_ms: 5000 });
}

export function queryMachineMetrics(machineId) {
  return adminPost(XB.admin.server.machineQueryMetrics, { machine_id: machineId, timeout_ms: 5000 });
}

export function fetchCertificates() {
  return adminGet(XB.admin.server.certificateFetch);
}

export function saveCertificate(body) {
  return adminPost(XB.admin.server.certificateSave, body);
}

export function issueCertificate(id) {
  return adminPost(XB.admin.server.certificateIssue, { id });
}

export function renewCertificate(id) {
  return adminPost(XB.admin.server.certificateRenew, { id });
}

export function dropCertificate(id) {
  return adminPost(XB.admin.server.certificateDrop, { id });
}

export function bindCertificate(serverId, certificateId) {
  return adminPost(XB.admin.server.certificateBind, { server_id: serverId, certificate_id: certificateId });
}
