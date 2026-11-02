<template>
  <div :class="{ 'record-nest': nested }">
    <template v-if="draft && draft.kind === 'object'">
      <div v-for="field in draft.fields" :key="field.key" class="form-group">
        <label class="form-label">
          {{ field.label }}
          <InfoTip v-if="field.tip" :text="field.tip" />
        </label>
        <RecordFields :draft="field.draft" nested />
      </div>
      <div v-if="extendable" class="toolbar">
        <input v-model="newKey" class="form-control" placeholder="项目名称" />
        <button class="action-button" type="button" @click="addField">添加</button>
      </div>
    </template>
    <div v-else-if="draft && draft.kind === 'list'" class="record-list">
      <div v-for="(item, index) in draft.items" :key="index" class="record-card">
        <div class="record-card-title">{{ item.title }}</div>
        <RecordFields :draft="item.draft" nested />
      </div>
    </div>
    <label v-else-if="draft && draft.kind === 'bool'" class="check-line">
      <input v-model="draft.value" type="checkbox" />
      <span>{{ draft.value ? '开' : '关' }}</span>
    </label>
    <textarea v-else-if="draft && draft.kind === 'lines'" v-model="draft.text" class="form-control" rows="4"></textarea>
    <textarea v-else-if="draft && draft.kind === 'yml'" v-model="draft.value" class="form-control" rows="12"></textarea>
    <input v-else-if="draft" v-model="draft.value" class="form-control" />
  </div>
</template>

<script>
import InfoTip from './InfoTip.vue';
import { fieldLabel, fieldTip } from '@/utils/recordFields';

export default {
  name: 'RecordFields',
  components: { InfoTip },
  props: {
    draft: { type: Object, default: null },
    nested: { type: Boolean, default: false },
    extendable: { type: Boolean, default: false }
  },
  data() {
    return { newKey: '' };
  },
  methods: {
    addField() {
      const key = this.newKey.trim();
      if (!key || !this.draft || this.draft.kind !== 'object') return;
      if (this.draft.fields.some((field) => field.key === key)) return;
      this.draft.fields.push({
        key,
        label: fieldLabel(key),
        tip: fieldTip(key),
        draft: { kind: 'text', value: '', numeric: false }
      });
      this.newKey = '';
    }
  }
};
</script>
