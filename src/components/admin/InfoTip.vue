<template>
  <span class="info-tip" tabindex="0">
    i
    <span class="info-tip-pop">{{ text }}</span>
  </span>
</template>

<script>
export default {
  name: 'InfoTip',
  props: {
    text: { type: String, default: '' }
  }
};
</script>
