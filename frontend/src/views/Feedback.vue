<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="font-display text-3xl font-semibold">Supervisor notes</h1>
    <p class="mb-6 mt-1 text-ink-mute">What your supervisor wrote on your reviewed weeks.</p>
    <p v-if="loading" class="text-ink-mute">Loading…</p>
    <p v-else-if="error" role="alert" class="text-sm form-error">{{ error }}</p>
    <EmptyState
      v-else-if="!items.length"
      title="No notes yet"
      body="Feedback appears here once a supervisor reviews one of your submitted weeks."
    />
    <div v-for="f in items" :key="f.id" class="ledger mb-3 p-4">
      <p class="tabular text-sm font-medium uppercase tracking-wide text-ink-mute">Week entry #{{ f.logbookEntryId }}</p>
      <p class="mt-1">{{ f.body }}</p>
      <p class="mt-1 text-xs text-ink-mute">{{ f.createdAt ?? '' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import { errMsg, listFeedback, type FeedbackItem } from '../api/client'

const loading = ref(true)
const error = ref('')
const items = ref<FeedbackItem[]>([])

onMounted(async () => {
  try {
    const { data } = await listFeedback()
    items.value = Array.isArray(data) ? data : []
  } catch (e: unknown) {
    error.value = errMsg(e)
  } finally {
    loading.value = false
  }
})
</script>
