<template>
  <transition name="fade">
    <div v-if="show" class="dialog-overlay" @click.self="$emit('close')">
      <div class="dialog-container" :class="{ wide }">
        <div class="dialog-header">
          <h2 class="dialog-title">{{ title }}</h2>
          <button class="dialog-close-btn" type="button" @click="$emit('close')">
            <IconX :size="20" />
          </button>
        </div>
        <div class="dialog-content">
          <slot />
        </div>
        <div v-if="$slots.footer" class="dialog-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { IconX } from '@tabler/icons-vue';

export default {
  name: 'AdminDialog',
  components: { IconX },
  props: {
    show: { type: Boolean, default: false },
    title: { type: String, default: '' },
    wide: { type: Boolean, default: false }
  },
  emits: ['close']
};
</script>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.dialog-container {
  width: 100%;
  max-width: 520px;
  background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &.wide {
    max-width: 760px;
  }
}

.dialog-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(var(--theme-color-rgb), 0.03);
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.dialog-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--secondary-text-color);
  border-radius: 50%;
  padding: 8px;
  transition: all 0.3s ease;

  &:hover {
    color: var(--text-color);
    transform: rotate(90deg);
  }
}

.dialog-content {
  padding: 20px;
  overflow-y: auto;
}

.dialog-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.dialog-btn) {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-width: 80px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

:deep(.dialog-btn-cancel) {
  background-color: var(--border-color);
  color: var(--text-color);
}

:deep(.dialog-btn-confirm) {
  background-color: var(--theme-color);
  color: white;
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
