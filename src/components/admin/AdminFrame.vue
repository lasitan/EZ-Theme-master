<template>
  <div class="admin-container">
    <div class="admin-inner">
      <div class="dashboard-card welcome-card">
        <div class="card-header">
          <h2 class="card-title">{{ title }}</h2>
          <div class="card-tools">
            <slot name="tools" />
          </div>
        </div>
        <div class="card-body">
          <p>{{ description }}</p>
        </div>
      </div>

      <div v-if="loading" class="admin-state">
        <p>{{ $t('admin.loading') }}</p>
      </div>
      <div v-else-if="error" class="admin-state">
        <p>{{ error }}</p>
        <button class="btn btn-primary retry-button" type="button" @click="$emit('retry')">{{ $t('admin.retry') }}</button>
      </div>
      <slot v-else />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminFrame',
  props: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' }
  },
  emits: ['retry']
};
</script>
