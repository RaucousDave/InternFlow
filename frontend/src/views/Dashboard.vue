<template>
  <div>
    <template v-if="isSupervisor">
      <h1 class="font-display text-3xl font-semibold">Records office</h1>
      <p class="mb-6 mt-1 text-ink-mute">Review students, logbooks, and completion from one desk.</p>
      <RouterLink to="/admin" class="btn-primary inline-block">Open the dashboard</RouterLink>
    </template>
    <template v-else>
      <h1 class="font-display text-3xl font-semibold">My SIWES record</h1>
      <p class="mb-6 mt-1 text-ink-mute">Your placement, weeks, and feedback in one place.</p>
      <p v-if="loading" class="text-ink-mute">Loading…</p>
      <p v-else-if="error" role="alert" class="text-sm form-error">{{ error }}</p>
      <template v-else>
        <div class="ledger mb-6 px-6 py-5">
          <p class="text-sm font-medium uppercase tracking-wide text-ink-mute">Completion</p>
          <p class="tabular font-display text-5xl font-semibold text-navy">{{ pct }}%</p>
          <p class="mt-1 text-sm text-ink-mute">{{ done }} of {{ total }} required steps filed</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="ledger p-5">
            <p class="text-sm font-medium uppercase tracking-wide text-ink-mute">Placement</p>
            <p class="mt-1 font-semibold">{{ placementDone ? 'On record' : 'Not yet filed' }}</p>
            <RouterLink to="/placement" class="mt-2 inline-block text-sm font-medium text-navy underline">Manage placement</RouterLink>
          </div>
          <div class="ledger p-5">
            <p class="text-sm font-medium uppercase tracking-wide text-ink-mute">Logbook</p>
            <p class="mt-1 font-semibold">{{ submitted }} of {{ weeks }} weeks submitted</p>
            <RouterLink to="/logbook" class="mt-2 inline-block text-sm font-medium text-navy underline">Open logbook</RouterLink>
          </div>
        </div>
        <div v-if="latestFeedback" class="ledger mt-4 p-5">
          <p class="text-sm font-medium uppercase tracking-wide text-ink-mute">Latest supervisor note</p>
          <p class="mt-1">{{ latestFeedback }}</p>
          <RouterLink to="/feedback" class="mt-2 inline-block text-sm font-medium text-navy underline">Read all feedback</RouterLink>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { errMsg, getProfile, getRole, listFeedback, listLogbook, listPlacements } from '../api/client'

const role = computed(() => getRole())
const isSupervisor = computed(() => role.value === 'SUPERVISOR')
const loading = ref(true)
const error = ref('')
const placementDone = ref(false)
const submitted = ref(0)
const weeks = ref(0)
const profileDone = ref(false)
const latestFeedback = ref<string | null>(null)

const done = computed(() => (profileDone.value ? 1 : 0) + (placementDone.value ? 1 : 0) + submitted.value)
const total = computed(() => 2 + weeks.value)
const pct = computed(() => (total.value ? Math.round((done.value / total.value) * 100) : 0))

onMounted(async () => {
  if (isSupervisor.value) return
  try {
    const [p, pl, lb, fb] = await Promise.all([getProfile(), listPlacements(), listLogbook(), listFeedback()])
    profileDone.value = !!(p.data.fullName && p.data.registrationNumber)
    placementDone.value = Array.isArray(pl.data) && pl.data.length > 0
    const entries = Array.isArray(lb.data) ? lb.data : []
    weeks.value = entries.length
    submitted.value = entries.filter((e) => e.status !== 'DRAFT').length
    const items = Array.isArray(fb.data) ? fb.data : []
    latestFeedback.value = items.length ? String(items[items.length - 1].body).slice(0, 140) : null
  } catch (e: unknown) {
    error.value = errMsg(e)
  } finally {
    loading.value = false
  }
})
</script>
