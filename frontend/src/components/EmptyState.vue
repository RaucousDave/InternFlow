<template>
  <div class="ledger px-6 py-10 text-center">
    <p class="font-display text-xl text-ink">{{ title }}</p>
    <p class="mx-auto mt-2 max-w-md text-sm text-ink-mute">{{ body }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; body: string }>()
</script>
