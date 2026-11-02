<template>
  <AdminFrame :title="t('admin.nodes.title')" :description="t('admin.nodes.description')">
    <div class="subtabs">
      <button v-for="item in tabs" :key="item.id" class="subtab" :class="{ active: current === item.id }" type="button" @click="current = item.id">
        {{ item.label }}
      </button>
    </div>
    <NodeList v-if="current === 'nodes'" />
    <GroupList v-else-if="current === 'groups'" />
    <RouteList v-else-if="current === 'routes'" />
    <MachineList v-else-if="current === 'machines'" />
    <CertList v-else />
  </AdminFrame>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import NodeList from './NodeList.vue';
import GroupList from './GroupList.vue';
import RouteList from './RouteList.vue';
import MachineList from './MachineList.vue';
import CertList from './CertList.vue';

const { t } = useI18n();
const current = ref('nodes');
const tabs = [
  { id: 'nodes', label: '节点' },
  { id: 'groups', label: '权限组' },
  { id: 'routes', label: '路由' },
  { id: 'machines', label: '机器' },
  { id: 'certs', label: '证书' }
];
</script>
