<template>

  <div class="landing-page" :class="{ 'dark-theme': isDarkTheme }" @wheel="handleWheel" @scroll="handleScroll" ref="landingPageRef">



    

    <!-- 背景装饰 -->

    <div class="background-decoration">

      <div class="bg-circle circle-1" :class="{ 'dark-mode': isDarkTheme }"></div>

      <div class="bg-circle circle-2" :class="{ 'dark-mode': isDarkTheme }"></div>

      <div class="bg-circle circle-3" :class="{ 'dark-mode': isDarkTheme }"></div>

    </div>

    

    <!-- 顶部工具栏 -->

    <div class="top-toolbar">

      <ThemeToggle />

      <LanguageSelector />

    </div>

    

    <section class="hero-section">
      <!-- 中央内容区 -->

      <div class="content-container">

        <div class="site-title">

          <img v-if="siteConfig.showLogo" src="/images/logo.png" alt="Logo" class="site-logo-img" />

          {{ siteConfig.siteName }}

        </div>

        <div class="landing-text">{{ $t('landing.mainText') }}</div>

      </div>
    </section>

    <section class="plans-section" ref="plansSectionRef">
      <div class="plans-title">
        {{ $t('shop.plans', '选择适合你的套餐') }}
      </div>
      <div class="plans-subtitle">
        {{ $t('', '') }}
      </div>

      <div class="plans-grid">
        <div class="plan-card" v-if="loadingPlans">
          <div class="plan-card-header">
            <div class="plan-name">{{ $t('common.loading', '加载中...') }}</div>
          </div>
          <div class="plan-card-body">
            <div class="plan-price">
              <span class="currency">¥</span>
              <span class="amount">--</span>
              <span class="period">--</span>
            </div>
            <div class="plan-features">
              <div class="feature-item">{{ $t('common.loading', '加载中...') }}</div>
            </div>
            <button class="plan-action" disabled>
              {{ $t('common.loading', '加载中...') }}
            </button>
          </div>
        </div>

        <div class="plans-empty" v-else-if="plans.length === 0">
          {{ $t('shop.no_plans_found', '暂无可用套餐') }}
        </div>

        <div class="plan-card" v-else v-for="plan in plans" :key="plan.id" @click="goShop">
          <div class="plan-card-header">
            <div class="plan-name">{{ plan.name }}</div>
            <div class="plan-badge" v-if="isRecommendedPlan(plan)">
              {{ recommendedBadgeText }}
            </div>
          </div>
          <div class="plan-card-body">
            <div class="plan-price">
              <span class="currency">¥</span>
              <span class="amount">{{ formatPriceYuan(getSelectedPrice(plan).value) }}</span>
              <span class="period-row">
                <span class="period">{{ getPeriodLabel(getSelectedPrice(plan).key) }}</span>
                <span class="period-buttons" @click.stop>
                  <button
                    v-for="opt in getPlanPrices(plan)"
                    :key="opt.key"
                    type="button"
                    class="period-btn"
                    :class="{ active: opt.key === getSelectedPrice(plan).key }"
                    @click.stop="selectPeriod(plan, opt.key)"
                  >
                    {{ getPeriodLabel(opt.key) }}
                  </button>
                </span>
              </span>
            </div>
            <div class="plan-features plan-markdown" v-html="renderPlanContentHtml(plan)"></div>
            <button class="plan-action" @click.stop="goShop">
              {{ $t('shop.plan.purchase', '查看并购买') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    

    <!-- 底部箭头 -->

    <div class="scroll-arrow-container" @click="handleArrowClick">

      <div class="scroll-arrow">

        <IconChevronDown :size="32" :stroke-width="1.5" />

      </div>

      <div class="scroll-text">{{ $t('landing.scrollText') }}</div>

    </div>

    

    <!-- 页面过渡遮罩 -->

    <div class="page-transition-mask" :class="{ 'active': isTransitioning }"></div>

  </div>

</template>



<script>

import { ref, onMounted, onUnmounted, computed } from 'vue';

import { useRouter } from 'vue-router';
import { navigateToLogin } from '@/utils/loginObf';

import { useStore } from 'vuex';

import { useI18n } from 'vue-i18n';

import { SITE_CONFIG, DEFAULT_CONFIG } from '@/utils/baseConfig';

import request from '@/api/request';

import MarkdownIt from 'markdown-it';

import DOMPurify from 'dompurify';


import ThemeToggle from '@/components/common/ThemeToggle.vue';

import LanguageSelector from '@/components/common/LanguageSelector.vue';

import { IconChevronDown } from '@tabler/icons-vue';

import DomainAuthAlert from '@/components/common/DomainAuthAlert.vue';



export default {

  name: 'LandingPage',

  components: {

    ThemeToggle,

    LanguageSelector,

    IconChevronDown,

    DomainAuthAlert

  },

  setup() {

    const router = useRouter();

    const store = useStore();

    const { t } = useI18n();

    const landingPageRef = ref(null);

    

    const isDarkTheme = computed(() => store.getters.currentTheme === 'dark');

    

    const siteConfig = ref(SITE_CONFIG);

    const defaultConfig = ref(DEFAULT_CONFIG);

    

    const isTransitioning = ref(false);

    const md = new MarkdownIt({
      html: false,
      linkify: true,
      breaks: true
    });

    const plans = ref([]);
    const loadingPlans = ref(true);
    const plansSectionRef = ref(null);
    const hasScrolledToPlans = ref(false);
    const isAutoScrolling = ref(false);
    const bottomArmed = ref(false);
    let bottomArmTimer = null;
    let bottomArmedAt = 0;
    const wasNearBottom = ref(false);

    let plansFetchPromise = null;

    const isLandingDebugEnabled = () => {
      try {
        if (typeof window !== 'undefined' && window.__EZ_LANDING_DEBUG__ === true) return true;
        if (typeof window !== 'undefined') {
          const qs = new URLSearchParams(window.location.search);
          if (qs.get('landingDebug') === '1') return true;
        }
      } catch (e) {
      }
      return false;
    };

    const dbg = (event, payload = {}) => {
      if (!isLandingDebugEnabled()) return;
      try {
        console.log('[LandingDebug]', event, {
          hasScrolledToPlans: hasScrolledToPlans.value,
          isAutoScrolling: isAutoScrolling.value,
          bottomArmed: bottomArmed.value,
          ...payload
        });
      } catch (e) {
      }
    };

    


    

    const handleScroll = (e) => {
      if (e.currentTarget !== landingPageRef.value) return;

      const el = landingPageRef.value;
      if (!el) return;

      const target = plansSectionRef.value;
      if (target && el.scrollTop >= target.offsetTop - 10) {
        if (!hasScrolledToPlans.value) {
          hasScrolledToPlans.value = true;
          dbg('ReachedPlansSection', { scrollTop: el.scrollTop, plansOffsetTop: target.offsetTop });
        }
      }

      const nearBottom = isNearBottom();
      if (!wasNearBottom.value && nearBottom) {
        wasNearBottom.value = true;
        if (bottomArmed.value) {
          bottomArmed.value = false;
          bottomArmedAt = 0;
          if (bottomArmTimer) {
            clearTimeout(bottomArmTimer);
            bottomArmTimer = null;
          }
          dbg('BottomArmedReset', { reason: 'enter_bottom_zone_reset' });
        } else {
          dbg('NearBottomEnter');
        }
      }

      if (wasNearBottom.value && !nearBottom) {
        wasNearBottom.value = false;
      }

      if (bottomArmed.value && !isNearBottom()) {
        bottomArmed.value = false;
        bottomArmedAt = 0;
        if (bottomArmTimer) {
          clearTimeout(bottomArmTimer);
          bottomArmTimer = null;
        }
        dbg('BottomArmedReset', { reason: 'leave_bottom', scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight });
      }
    };

    

    const scrollToPlans = () => {
      const el = landingPageRef.value;
      const target = plansSectionRef.value;
      if (!el || !target) return;

      isAutoScrolling.value = true;
      dbg('ScrollToPlansStart', { scrollTop: el.scrollTop, plansOffsetTop: target.offsetTop });
      el.scrollTo({
        top: target.offsetTop,
        behavior: 'smooth'
      });
      hasScrolledToPlans.value = true;

      setTimeout(() => {
        isAutoScrolling.value = false;
        dbg('ScrollToPlansEnd');
      }, 700);
    };

    const isNearBottom = () => {
      const el = landingPageRef.value;
      if (!el) return false;
      const threshold = 24;
      return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    };

    const armBottomOnce = () => {
      bottomArmed.value = true;
      bottomArmedAt = Date.now();
      dbg('BottomArmedOnce');
      if (bottomArmTimer) {
        clearTimeout(bottomArmTimer);
      }
      bottomArmTimer = setTimeout(() => {
        bottomArmed.value = false;
        bottomArmedAt = 0;
        bottomArmTimer = null;
        dbg('BottomArmedReset', { reason: 'timeout' });
      }, 2500);
    };

    const canTriggerSecondBottom = () => {
      const minGapMs = 450;
      if (!bottomArmedAt) return true;
      return Date.now() - bottomArmedAt >= minGapMs;
    };

    const isFastWheelDown = (e) => {
      return e && typeof e.deltaY === 'number' && e.deltaY >= 160;
    };

    const handleWheel = (e) => {
      if (e.currentTarget !== landingPageRef.value) return;
      if (e.deltaY <= 0) return;

      if (!hasScrolledToPlans.value) {
        e.preventDefault();
        dbg('WheelDown', { deltaY: e.deltaY, action: 'scroll_to_plans' });
        scrollToPlans();
        return;
      }

      if (isAutoScrolling.value) {
        dbg('WheelDown', { deltaY: e.deltaY, action: 'ignored_auto_scrolling' });
        return;
      }

      if (!isNearBottom()) {
        dbg('WheelDown', { deltaY: e.deltaY, action: 'ignored_not_near_bottom' });
        return;
      }

      if (isFastWheelDown(e)) {
        dbg('WheelDown', { deltaY: e.deltaY, action: 'navigate_login_fast' });
        navigateToLoginLocal();
        return;
      }

      if (!bottomArmed.value) {
        dbg('WheelDown', { deltaY: e.deltaY, action: 'arm_bottom_first' });
        armBottomOnce();
        return;
      }

      if (!canTriggerSecondBottom()) {
        dbg('WheelDown', { deltaY: e.deltaY, action: 'ignored_same_gesture' });
        return;
      }

      dbg('WheelDown', { deltaY: e.deltaY, action: 'navigate_login_second' });
      navigateToLoginLocal();
    };

    

    const navigateToLoginLocal = () => {

      if (isTransitioning.value) {

        dbg('NavigateLoginBlocked', { reason: 'transitioning' });

        return;

      }



      isTransitioning.value = true;

      dbg('NavigateLoginTriggered');

      

      document.body.classList.add('page-transitioning');

      

      console.log(t('landing.navigatingToLogin', 'Navigating to login page'));

      

      setTimeout(() => {
        navigateToLogin(router);
      }, 600);
    };

    

    let touchStartY = 0;
    let touchStartTime = 0;

    let handleTouchStart, handleTouchMove;

    

    const fetchPlans = () => {
      if (plansFetchPromise) return plansFetchPromise;

      loadingPlans.value = true;
      plansFetchPromise = request({
        url: '/guest/plan/fetch',
        method: 'get'
      })
        .then((res) => {
          plans.value = Array.isArray(res?.data) ? res.data : [];
          return plans.value;
        })
        .catch(() => {
          plans.value = [];
          return plans.value;
        })
        .finally(() => {
          loadingPlans.value = false;
        });

      return plansFetchPromise;
    };

    onMounted(() => {

      fetchPlans();

      handleTouchStart = (e) => {

        if (e.currentTarget === landingPageRef.value || landingPageRef.value.contains(e.target)) {

          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();

          dbg('TouchStart', { y: touchStartY });

        }

      };

      

      handleTouchMove = (e) => {

        if (e.currentTarget === landingPageRef.value || landingPageRef.value.contains(e.target)) {

          const touchY = e.touches[0].clientY;
          const touchNow = Date.now();
          const touchDeltaY = touchStartY - touchY;
          const touchDt = Math.max(1, touchNow - touchStartTime);
          const isFastSwipeDown = touchDeltaY >= 180 && touchDt <= 280;

          if (touchDeltaY > 50) {
            if (!hasScrolledToPlans.value) {
              dbg('TouchSwipeDown', { deltaY: touchDeltaY, dt: touchDt, fast: isFastSwipeDown, action: 'scroll_to_plans' });
              scrollToPlans();
              return;
            }

            if (isAutoScrolling.value) {
              dbg('TouchSwipeDown', { deltaY: touchDeltaY, dt: touchDt, fast: isFastSwipeDown, action: 'ignored_auto_scrolling' });
              return;
            }

            if (!isNearBottom()) {
              dbg('TouchSwipeDown', { deltaY: touchDeltaY, dt: touchDt, fast: isFastSwipeDown, action: 'ignored_not_near_bottom' });
              return;
            }

            if (isFastSwipeDown) {
              dbg('TouchSwipeDown', { deltaY: touchDeltaY, dt: touchDt, fast: isFastSwipeDown, action: 'navigate_login_fast' });
              navigateToLoginLocal();
              return;
            }

            if (!bottomArmed.value) {
              dbg('TouchSwipeDown', { deltaY: touchDeltaY, dt: touchDt, fast: isFastSwipeDown, action: 'arm_bottom_first' });
              armBottomOnce();
              return;
            }

            if (!canTriggerSecondBottom()) {
              dbg('TouchSwipeDown', { deltaY: touchDeltaY, dt: touchDt, fast: isFastSwipeDown, action: 'ignored_same_gesture' });
              return;
            }

            dbg('TouchSwipeDown', { deltaY: touchDeltaY, dt: touchDt, fast: isFastSwipeDown, action: 'navigate_login_second' });
            navigateToLoginLocal();
          }

        }

      };

      

      if (landingPageRef.value) {

        landingPageRef.value.addEventListener('touchstart', handleTouchStart, { passive: true });

        landingPageRef.value.addEventListener('touchmove', handleTouchMove, { passive: true });

      }

    });

    const getPlanPrices = (plan) => {
      const keys = [
        'month_price',
        'quarter_price',
        'half_year_price',
        'year_price',
        'three_year_price',
        'two_year_price',
        'onetime_price'
      ];
      return keys
        .filter(k => plan && plan[k] !== null && plan[k] !== undefined)
        .map(k => ({ key: k, value: plan[k] }));
    };

    const formatPriceYuan = (cents) => {
      const n = Number(cents);
      if (!Number.isFinite(n)) return '--';
      const yuan = n / 100;
      return yuan
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1');
    };

    const getMainPrice = (plan) => {
      const prices = getPlanPrices(plan);
      return prices.length > 0 ? prices[0] : { key: '', value: null };
    };

    const selectedPeriodKeyByPlanId = ref({});

    const getSelectedPrice = (plan) => {
      if (!plan) return { key: '', value: null };
      const selectedKey = selectedPeriodKeyByPlanId.value[plan.id];
      const prices = getPlanPrices(plan);
      if (selectedKey) {
        const matched = prices.find(p => p.key === selectedKey);
        if (matched) return matched;
      }
      return getMainPrice(plan);
    };

    const selectPeriod = (plan, key) => {
      if (!plan || !key) return;
      selectedPeriodKeyByPlanId.value = {
        ...selectedPeriodKeyByPlanId.value,
        [plan.id]: key
      };
      dbg('SelectPeriod', { planId: plan.id, key });
    };

    const getPeriodLabel = (key) => {
      const map = {
        month_price: t('shop.plan.price_options.month', '月付'),
        quarter_price: t('shop.plan.price_options.quarter', '季度'),
        half_year_price: t('shop.plan.price_options.half_year', '半年'),
        year_price: t('shop.plan.price_options.year', '一年'),
        three_year_price: t('shop.plan.price_options.three_year', '三年'),
        two_year_price: t('shop.plan.price_options.two_year', '两年'),
        onetime_price: t('shop.plan.price_options.onetime', '一次性')
      };
      return map[key] || '';
    };

    const renderPlanContentHtml = (plan) => {
      const raw = (plan && typeof plan.content === 'string') ? plan.content : '';
      const markdown = raw && raw.trim() ? raw : t('shop.plan.feature_default', '高速稳定 / 安全私密 / 多平台');
      const rendered = md.render(markdown);
      return DOMPurify.sanitize(rendered, {
        USE_PROFILES: { html: true }
      });
    };

    const recommendedBadgeText = computed(() => {
      return (window.EZ_CONFIG && window.EZ_CONFIG.SHOP_CONFIG && window.EZ_CONFIG.SHOP_CONFIG.recommendedBadgeText)
        ? window.EZ_CONFIG.SHOP_CONFIG.recommendedBadgeText
        : t('shop.recommended', '推荐购买');
    });

    const isRecommendedPlan = (plan) => {
      const indices = (window.EZ_CONFIG && window.EZ_CONFIG.SHOP_CONFIG && Array.isArray(window.EZ_CONFIG.SHOP_CONFIG.recommendedPlanIndices))
        ? window.EZ_CONFIG.SHOP_CONFIG.recommendedPlanIndices
        : [];
      const idx = plans.value.findIndex(p => p && plan && p.id === plan.id);
      return idx >= 0 && indices.includes(idx + 1);
    };

    const goShop = () => {
      router.push('/shop');
    };

    const handleArrowClick = () => {
      if (!hasScrolledToPlans.value) {
        scrollToPlans();
        return;
      }
      navigateToLoginLocal();
    };

    

    onUnmounted(() => {

      if (landingPageRef.value) {

        landingPageRef.value.removeEventListener('touchstart', handleTouchStart);

        landingPageRef.value.removeEventListener('touchmove', handleTouchMove);

      }

    });

    

    return {

      landingPageRef,

      siteConfig,

      defaultConfig,

      isDarkTheme,

      isTransitioning,

      navigateToLogin: navigateToLoginLocal,

      handleArrowClick,

      handleScroll,

      handleWheel,

      plans,

      loadingPlans,

      plansSectionRef,

      getMainPrice,

      getSelectedPrice,

      selectPeriod,

      getPlanPrices,

      formatPriceYuan,

      getPeriodLabel,

      renderPlanContentHtml,

      isRecommendedPlan,

      recommendedBadgeText,

      goShop,


    };

  }

};

</script>



<style lang="scss" scoped>

.landing-page {

  position: relative;

  width: 100%;

  height: 100vh;

  overflow-y: auto;

  display: flex;

  flex-direction: column;

  justify-content: flex-start;

  align-items: stretch;

  background-color: var(--background-color);

  color: var(--text-color);

  transition: background-color 0.3s ease, color 0.3s ease;

}

.hero-section {

  min-height: 100vh;

  width: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

}

.plans-section {

  width: 100%;

  padding: 90px 20px 120px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: flex-start;

  z-index: 10;

}

.plans-title {

  font-size: 28px;

  font-weight: 700;

  color: var(--text-color);

  margin-bottom: 8px;

}

.plans-subtitle {

  font-size: 14px;

  color: var(--secondary-text-color);

  opacity: 0.9;

  margin-bottom: 24px;

}

.plans-grid {

  width: 100%;

  max-width: 1100px;

  display: grid;

  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

  gap: 16px;

}

.plans-empty {

  width: 100%;

  max-width: 1100px;

  text-align: center;

  color: var(--secondary-text-color);

  padding: 24px 0;

}

.plan-card {

  background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);

  border-radius: 16px;

  border: 1px solid rgba(var(--theme-color-rgb), 0.15);

  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);

  padding: 18px;

  cursor: pointer;

  transition: all 0.3s ease;

}

.landing-page.dark-theme .plan-card {

  background-color: rgba(var(--card-background-rgb, 30, 30, 30), 1);

}

.plan-card:hover {

  transform: translateY(-4px);

  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.1);

}

.plan-card-header {

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 12px;

  margin-bottom: 12px;

}

.plan-name {

  font-size: 16px;

  font-weight: 700;

  color: var(--text-color);

}

.plan-badge {

  padding: 6px 10px;

  border-radius: 999px;

  font-size: 12px;

  font-weight: 600;

  background-color: rgba(var(--theme-color-rgb), 0.12);

  color: var(--theme-color);

  border: 1px solid rgba(var(--theme-color-rgb), 0.25);

  white-space: nowrap;

}

.plan-card-body {

  display: flex;

  flex-direction: column;

  gap: 12px;

}

.plan-price {

  display: flex;

  align-items: baseline;

  gap: 8px;

}

.period-row {

  display: inline-flex;

  align-items: center;

  gap: 10px;

  flex-wrap: wrap;

}

.period-buttons {

  display: inline-flex;

  align-items: center;

  gap: 6px;

  flex-wrap: wrap;

}

.period-btn {

  border: 1px solid rgba(var(--theme-color-rgb), 0.18);

  background-color: rgba(var(--theme-color-rgb), 0.06);

  color: var(--secondary-text-color);

  padding: 3px 8px;

  border-radius: 999px;

  font-size: 12px;

  line-height: 1.4;

  cursor: pointer;

  transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;

}

.period-btn:hover {

  border-color: rgba(var(--theme-color-rgb), 0.35);

  color: var(--text-color);

}

.period-btn.active {

  background-color: rgba(var(--theme-color-rgb), 0.16);

  border-color: rgba(var(--theme-color-rgb), 0.55);

  color: var(--theme-color);

}

.plan-price .currency {

  font-size: 14px;

  color: var(--secondary-text-color);

}

.plan-price .amount {

  font-size: 36px;

  font-weight: 800;

  color: var(--text-color);

  line-height: 1;

}

.plan-price .period {

  font-size: 12px;

  color: var(--secondary-text-color);

}

.plan-features {

  display: flex;

  flex-direction: column;

  gap: 8px;

}

.plan-markdown {

  width: 100%;

  color: var(--text-color);

  opacity: 0.92;

  font-size: 13px;

  line-height: 1.6;

}

.plan-markdown :deep(h1),
.plan-markdown :deep(h2),
.plan-markdown :deep(h3) {

  font-size: 14px;

  margin: 0 0 8px;

}

.plan-markdown :deep(p) {

  margin: 0 0 8px;

}

.plan-markdown :deep(ul),
.plan-markdown :deep(ol) {

  margin: 0 0 8px 18px;

  padding: 0;

}

.plan-markdown :deep(li) {

  margin: 4px 0;

}

.plan-markdown :deep(strong) {

  color: var(--theme-color);

  font-weight: 700;

}

.plan-markdown :deep(code) {

  padding: 2px 6px;

  border-radius: 6px;

  background-color: rgba(var(--theme-color-rgb), 0.08);

}

.feature-item {

  font-size: 13px;

  color: var(--text-color);

  opacity: 0.9;

}

.plan-action {

  width: 100%;

  padding: 10px 12px;

  border-radius: 10px;

  border: none;

  cursor: pointer;

  background-color: var(--theme-color);

  color: #fff;

  font-weight: 600;

  transition: all 0.2s ease;

}

.plan-action:hover {

  transform: translateY(-1px);

}

.plan-action:disabled {

  opacity: 0.7;

  cursor: not-allowed;

  transform: none;

}





.background-decoration {

  position: absolute;

  top: 0;

  left: 0;

  width: 100%;

  height: 100%;

  z-index: 0;

  overflow: hidden;

  

  @supports (-webkit-touch-callout: none) {

    display: none;

  }

  

  .bg-circle {

    position: absolute;

    border-radius: 50%;

    filter: blur(80px);

    opacity: 0.4; 

    animation: float 20s infinite ease-in-out;

    transition: opacity 0.5s ease, background-color 0.5s ease;

    

    @supports (-webkit-touch-callout: none) {

      filter: blur(20px);

      opacity: 0.15;

      animation-duration: 40s; 
    }

    

    &.dark-mode {

      opacity: 0.25; 

      filter: blur(100px) saturate(0.7); 

      

      @supports (-webkit-touch-callout: none) {

        filter: blur(15px) saturate(0.5);

        opacity: 0.1;

      }

    }

  }

  

  .circle-1 {

    width: 600px;

    height: 600px;

    background: var(--theme-color);

    top: -10%;

    left: -10%;

    animation-duration: 25s;

    

    &.dark-mode {

      background: rgba(0, 148, 124, 0.6); 

    }

  }

  

  .circle-2 {

    width: 500px;

    height: 500px;

    background: #A747FE;

    top: 40%;

    right: -5%;

    animation-duration: 30s;

    

    &.dark-mode {

      background: rgba(167, 71, 254, 0.5); 

    }

  }

  

  .circle-3 {

    width: 450px;

    height: 450px;

    background: #37DEC9;

    bottom: -10%;

    left: 20%;

    animation-duration: 35s;

    

    &.dark-mode {

      background: rgba(55, 222, 201, 0.5); 

    }

  }

}



@keyframes float {

  0%, 100% {

    transform: translate(0, 0) rotate(0deg);

  }

  25% {

    transform: translate(5%, 5%) rotate(5deg);

  }

  50% {

    transform: translate(0, 10%) rotate(0deg);

  }

  75% {

    transform: translate(-5%, 5%) rotate(-5deg);

  }

}





.top-toolbar {

  position: fixed;

  top: 20px;

  right: 25px;

  display: flex;

  gap: 12px;

  z-index: 100;

}





.content-container {

  position: relative;

  z-index: 10;

  text-align: center;

  padding: 0 20px;

  max-width: 800px;

}



.site-title {

  font-size: 48px;

  font-weight: 700;

  margin-bottom: 20px;

  background: linear-gradient(to right, var(--theme-color), #a78bfa);

  -webkit-background-clip: text;

  background-clip: text;

  color: transparent;

  text-align: center;

  letter-spacing: -0.5px;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 15px;

  

  .site-logo-img {

    height: 40px;

    width: 40px;

    border-radius: 10px;

    object-fit: cover;

  }

}



.landing-text {

  font-size: 1.5rem;

  font-weight: 400;

  line-height: 1.5;

  margin-bottom: 2rem;

  color: var(--text-color);

  opacity: 0.9;

  

  @media (max-width: 768px) {

    font-size: 1.25rem;

  }

  

  @media (max-width: 480px) {

    font-size: 1rem;

  }

}





.scroll-arrow-container {

  position: fixed;

  bottom: 40px;

  left: 50%;

  transform: translateX(-50%);

  display: flex;

  flex-direction: column;

  align-items: center;

  cursor: pointer;

  z-index: 10;

  transition: transform 0.3s ease;

  

  &:hover {

    transform: translateX(-50%) translateY(5px);

    

    .scroll-arrow {

      animation-play-state: paused;

    }

  }

}



.scroll-arrow {

  color: var(--theme-color);

  animation: bounce 2s infinite;

  margin-bottom: 8px;

}



.scroll-text {

  font-size: 0.875rem;

  color: var(--secondary-text-color);

  opacity: 0.8;

}



@keyframes bounce {

  0%, 20%, 50%, 80%, 100% {

    transform: translateY(0);

  }

  40% {

    transform: translateY(-20px);

  }

  60% {

    transform: translateY(-10px);

  }

}





.page-transition-mask {

  position: fixed;

  top: 0;

  left: 0;

  width: 100%;

  height: 100%;

  background-color: var(--background-color);

  z-index: 1000;

  opacity: 0;

  pointer-events: none;

  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  

  &.active {

    opacity: 1;

    pointer-events: all;

  }

}





@media (max-width: 768px) {

  .scroll-arrow-container {

    bottom: 30px;

  }

  .plans-section {

    padding: 80px 16px 110px;

  }

  .plan-price .amount {

    font-size: 32px;

  }

}

</style>
