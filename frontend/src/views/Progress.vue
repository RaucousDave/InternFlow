<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="font-display text-3xl font-semibold">Sign-off sheet</h1>
    <p class="mb-6 mt-1 text-ink-mute">Everything required before your SIWES can be marked complete.</p>
    <p v-if="loading" class="text-ink-mute">Loading…</p>
    <p v-else-if="error" role="alert" class="text-sm form-error">{{ error }}</p>
    <template v-else>
      <div class="ledger mb-6 px-6 py-5">
        <p class="tabular font-display text-5xl font-semibold text-navy">{{ pct }}%</p>
        <p class="mt-1 text-sm text-ink-mute">{{ done }} of {{ checks.length }} requirements met</p>
      </div>
      <ul class="ledger divide-y divide-ledger">
        <li v-for="c in checks" :key="c.label" class="flex items-center gap-3 p-4">
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border"
            :class="c.done ? 'border-seal-green bg-seal-green text-white' : 'border-ink-mute/40'"
            aria-hidden="true"
          >
            <svg v-if="c.done" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6.5 4.8 9 10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="sr-only">{{ c.done ? 'Met: ' : 'Outstanding: ' }}</span>
          <span :class="c.done ? '' : 'text-ink-soft'">{{ c.label }}</span>
          <RouterLink v-if="!c.done && c.to" :to="c.to" class="ml-auto shrink-0 text-sm font-medium text-navy underline">Go</RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { errMsg, getProfile, listLogbook, listPlacements } from '../api/client'

interface Check {
  label: string
  done: boolean
  to?: string
}

const loading = ref(true)
const error = ref('')
const checks = ref<Check[]>([])
const done = computed(() => checks.value.filter((c) => c.done).length)
const pct = computed(() => (checks.value.length ? Math.round((done.value / checks.value.length) * 100) : 0))

onMounted(async () => {
  try {
    const [p, pl, lb] = await Promise.all([getProfile(), listPlacements(), listLogbook()])
    const list: Check[] = [
      { label: 'Profile completed', done: !!(p.data.fullName && p.data.registrationNumber), to: '/profile' },
    ]
    const hasPlacement = Array.isArray(pl.data) && pl.data.length > 0
    list.push({ label: 'Placement on record', done: hasPlacement, to: '/placement' })
    const entries = Array.isArray(lb.data) ? [...lb.data].sort((a, b) => a.weekNumber - b.weekNumber) : []
    for (const e of entries) {
      list.push({
        label: `Week ${e.weekNumber} ${e.status === 'DRAFT' ? 'filed as draft — submit it' : e.status.toLowerCase()}`,
        done: e.status !== 'DRAFT',
        to: `/logbook/${e.id}`,
      })
    }
    if (!entries.length) list.push({ label: 'No weeks filed yet', done: false, to: '/logbook' })
    checks.value = list
  } catch (e: unknown) {
    error.value = errMsg(e)
  } finally {
    loading.value = false
  }
})
</script>
