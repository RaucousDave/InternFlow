<template>
  <span :class="cls">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const label = computed(() => props.status.replace(/_/g, ' '))

const cls = computed(() => {
  switch (props.status) {
    case 'SUBMITTED':
      return 'seal-submitted'
    case 'REVIEWED':
    case 'OK':
      return 'seal-reviewed'
    default:
      return 'seal-draft'
  }
})
</script>
