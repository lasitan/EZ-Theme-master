<template>
  <AdminFrame :title="t(current.title)" :description="t(current.description)">
    <div class="stats-grid">
      <button
        v-for="card in current.cards"
        :key="card.to"
        class="stats-card"
        type="button"
        @click="router.push(card.to)"
      >
        <div class="stats-icon">
          <component :is="card.icon" :size="28" />
        </div>
        <div class="stats-info">
          <div class="stats-value">{{ t(card.title) }}</div>
          <div class="stats-label">{{ t(card.desc) }}</div>
        </div>
      </button>
    </div>
  </AdminFrame>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AdminFrame from '@/components/admin/AdminFrame.vue';
import IconShop from '@/components/icons/IconShop.vue';
import IconCredit from '@/components/icons/IconCredit.vue';
import IconUsers from '@/components/icons/IconUsers.vue';
import IconSubscription from '@/components/icons/IconSubscription.vue';
import IconInfo from '@/components/icons/IconInfo.vue';
import IconTicket from '@/components/icons/IconTicket.vue';
import IconWallet from '@/components/icons/IconWallet.vue';
import IconFileText from '@/components/icons/IconFileText.vue';
import IconSettings from '@/components/icons/IconSettings.vue';
import IconMoney from '@/components/icons/IconMoney.vue';
import IconCode from '@/components/icons/IconCode.vue';
import IconDashboard from '@/components/icons/IconDashboard.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const groups = {
  AdminBusiness: {
    title: 'admin.business.title',
    description: 'admin.business.description',
    cards: [
      { to: '/admin/orders', title: 'admin.orders.title', desc: 'admin.orders.description', icon: IconShop },
      { to: '/admin/plans', title: 'admin.plans.title', desc: 'admin.plans.description', icon: IconCredit },
      { to: '/admin/users', title: 'admin.users.title', desc: 'admin.users.description', icon: IconUsers },
      { to: '/admin/nodes', title: 'admin.nodes.title', desc: 'admin.nodes.description', icon: IconSubscription }
    ]
  },
  AdminContent: {
    title: 'admin.content.title',
    description: 'admin.content.description',
    cards: [
      { to: '/admin/notices', title: 'admin.notices.title', desc: 'admin.notices.description', icon: IconFileText },
      { to: '/admin/coupons', title: 'admin.coupons.title', desc: 'admin.coupons.description', icon: IconCredit },
      { to: '/admin/gift-cards', title: 'admin.giftCards.title', desc: 'admin.giftCards.description', icon: IconWallet },
      { to: '/admin/tickets', title: 'admin.tickets.title', desc: 'admin.tickets.description', icon: IconTicket },
      { to: '/admin/knowledge', title: 'admin.knowledge.title', desc: 'admin.knowledge.description', icon: IconInfo }
    ]
  },
  AdminSystem: {
    title: 'admin.system.title',
    description: 'admin.system.description',
    cards: [
      { to: '/admin/config', title: 'admin.config.title', desc: 'admin.config.description', icon: IconSettings },
      { to: '/admin/payments', title: 'admin.payments.title', desc: 'admin.payments.description', icon: IconMoney },
      { to: '/admin/plugins', title: 'admin.plugins.title', desc: 'admin.plugins.description', icon: IconCode },
      { to: '/admin/traffic', title: 'admin.traffic.title', desc: 'admin.traffic.description', icon: IconDashboard }
    ]
  }
};

const current = computed(() => groups[route.name] || groups.AdminBusiness);
</script>
