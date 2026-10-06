<template>
  <div class="mx-auto max-w-3xl">
    <BackButton fallback="/admin" label="Back to the register" />
    <h1 class="mb-6 mt-2 font-display text-3xl font-semibold">Student record</h1>
    <p v-if="loading" class="text-ink-mute">Loading…</p>
    <p v-else-if="error" role="alert" class="text-sm form-error">{{ error }}</p>
    <template v-else>
      <div class="ledger mb-6 p-5">
        <p class="font-display text-xl font-semibold">{{ detail?.fullName ?? detail?.name }}</p>
        <p class="mt-1 text-sm text-ink-soft">{{ detail?.registrationNumber }} · {{ detail?.email }}</p>
      </div>
      <h2 class="mb-3 font-display text-2xl font-semibold">Filed weeks</h2>
      <EmptyState
        v-if="!entries.length"
        title="No weeks filed"
        body="This student has not filed any logbook week yet."
      />
      <div v-for="e in entries" :key="e.id" class="ledger mb-3 p-5">
        <div class="flex flex-wrap items-center gap-2">
          <p class="tabular font-semibold">Week {{ e.weekNumber }}</p>
          <StatusSeal :status="e.status" />
        </div>
        <p class="mt-2 whitespace-pre-wrap text-sm">{{ e.activities }}</p>
        <form v-if="canReview(e)" class="mt-3 flex gap-2" @submit.prevent="sendFeedback(e.id!, fb[e.id!] ?? '')">
          <label :for="`fb-${e.id}`" class="sr-only">Feedback for week {{ e.weekNumber }}</label>
          <input
            :id="`fb-${e.id}`" v-model="fb[e.id!]" required
            placeholder="Write feedback for this week…" autocomplete="off"
            class="field flex-1 text-sm"
          />
          <button class="btn-primary shrink-0 text-sm" :disabled="sending">Send</button>
        </form>
        <div v-else-if="e.feedback?.length" class="mt-3">
          <p class="text-xs font-medium uppercase tracking-wide text-ink-mute">Supervisor feedback</p>
          <div v-for="f in e.feedback" :key="f.id ?? f.body" class="mt-1 text-sm">
            <p class="whitespace-pre-wrap">{{ f.body }}</p>
            <p v-if="f.createdAt" class="tabular mt-1 text-xs text-ink-mute">{{ fmtDate(f.createdAt) }}</p>
          </div>
        </div>
        <p v-else-if="e.status === 'DRAFT'" class="mt-3 text-sm text-ink-mute">Not submitted yet — feedback opens after the student submits.</p>
      </div>
      <p v-if="msg" role="status" class="text-sm" :class="ok ? 'text-seal-green' : 'form-error'">{{ msg }}</p>
      <div class="ledger mt-6 p-5">
        <h2 class="font-display text-xl font-semibold">Sign-off</h2>
        <p class="mt-1 text-sm text-ink-mute">Marking complete is allowed only when profile, placement, and reviewed weeks are all in place — the backend verifies this.</p>
        <button class="btn-danger-approve mt-3" :disabled="busy" @click="complete">{{ busy ? 'Checking…' : 'Mark SIWES complete' }}</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import BackButton from '../components/BackButton.vue'
import StatusSeal from '../components/StatusSeal.vue'
import {
  errMsg,
  fmtDate,
  getStudent,
  getStudentLogbook,
  giveFeedback,
  markComplete,
  type LogbookEntry,
} from '../api/client'

const route = useRoute()
const id = String(route.params.id ?? '')
const loading = ref(true)
const busy = ref(false)
const sending = ref(false)
const error = ref('')
const msg = ref('')
const ok = ref(false)
const detail = ref<Record<string, string> | null>(null)
const entries = ref<LogbookEntry[]>([])
const fb = reactive<Record<string, string>>({})

onMounted(async () => {
  try {
    const [s, lb] = await Promise.all([getStudent(id), getStudentLogbook(id)])
    detail.value = s.data as Record<string, string>
    entries.value = Array.isArray(lb.data) ? [...lb.data].sort((a, b) => a.weekNumber - b.weekNumber) : []
  } catch (e: unknown) {
    error.value = errMsg(e)
  } finally {
    loading.value = false
  }
})

function canReview(e: LogbookEntry) {
  return e.status === 'SUBMITTED' && !(e.feedback?.length)
}

async function sendFeedback(logbookId: string, body: string) {
  msg.value = ''
  ok.value = false
  sending.value = true
  try {
    await giveFeedback(logbookId, body)
    fb[logbookId] = ''
    const entry = entries.value.find((x) => x.id === logbookId)
    if (entry) {
      entry.status = 'REVIEWED'
      entry.feedback = [
        ...(entry.feedback ?? []),
        { logbookEntryId: logbookId, body: body.trim(), createdAt: new Date().toISOString() },
      ]
    }
    ok.value = true
    msg.value = 'Feedback recorded.'
  } catch (e: unknown) {
    msg.value = errMsg(e)
  } finally {
    sending.value = false
  }
}

async function complete() {
  if (!confirm('Mark this student complete? The backend confirms every requirement first.')) return
  msg.value = ''
  ok.value = false
  busy.value = true
  try {
    await markComplete(id)
    ok.value = true
    msg.value = 'Signed off as complete.'
  } catch (e: unknown) {
    msg.value = errMsg(e)
  } finally {
    busy.value = false
  }
}
</script>
