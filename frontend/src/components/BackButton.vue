<template>
  <button type="button" class="text-sm font-medium text-navy underline" @click="goBack">
    ← {{ label }}
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ fallback?: string; label?: string }>(), {
  fallback: '/',
  label: 'Back',
})

const router = useRouter()

function goBack() {
  // Takes the user to the previous screen. When the page was opened directly
  // (no previous screen in history), go to the fallback address instead.
  if (window.history.length > 1) router.back()
  else router.push(props.fallback)
}
</script>
