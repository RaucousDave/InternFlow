<template>
  <div class="mx-auto max-w-3xl">
    <BackButton />
    <h1 class="font-display text-3xl font-semibold">Weekly logbook</h1>
    <p class="mb-6 mt-1 text-ink-mute">One entry per week. Submitted weeks lock and cannot be edited.</p>
    <p v-if="loading" class="text-ink-mute">Loading…</p>
    <template v-else>
      <p v-if="error" role="alert" class="mb-4 text-sm form-error">{{ error }}</p>
      <EmptyState
        v-if="!entries.length && !error"
        title="No weeks filed yet"
        body="File your first week below. Drafts stay editable until you submit them for review."
      />
      <table v-else class="ledger w-full text-left text-sm">
        <caption class="sr-only">Filed logbook weeks with review status</caption>
        <thead>
          <tr class="border-b border-ledger text-xs uppercase tracking-wide text-ink-mute">
            <th scope="col" class="p-3 font-medium">Week</th>
            <th scope="col" class="p-3 font-medium">Dates</th>
            <th scope="col" class="p-3 font-medium">Status</th>
            <th scope="col" class="p-3 font-medium"><span class="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in entries" :key="e.id" class="border-b border-ledger last:border-0">
            <td class="tabular p-3 font-semibold">{{ e.weekNumber }}</td>
            <td class="tabular p-3 text-ink-soft">{{ fmtDate(e.startDate) }} → {{ fmtDate(e.endDate) }}</td>
            <td class="p-3"><StatusSeal :status="e.status" /></td>
            <td class="p-3 text-right">
              <RouterLink :to="`/logbook/${e.id}`" class="font-medium text-navy underline">
                {{ e.status === 'DRAFT' ? 'Continue writing' : 'Read entry' }}
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
      <h2 class="mb-3 mt-8 font-display text-2xl font-semibold">File a new week</h2>
      <p class="mb-3 text-sm text-ink-mute">Weeks open one at a time — right now you can file up to week {{ maxWeek }}.</p>
      <form class="ledger flex flex-col gap-4 p-6" novalidate @submit.prevent="onCreate">
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label for="lb-week" class="mb-1 block text-sm font-medium">Week number</label>
            <input id="lb-week" v-model.number="form.weekNumber" type="number" min="1" :max="maxWeek" required class="field tabular" />
          </div>
          <div>
            <label for="lb-start" class="mb-1 block text-sm font-medium">Start date</label>
            <input id="lb-start" v-model="form.startDate" type="date" required :max="today" class="field" />
          </div>
          <div>
            <label for="lb-end" class="mb-1 block text-sm font-medium">End date</label>
            <input id="lb-end" v-model="form.endDate" type="date" required :max="today" class="field" />
          </div>
        </div>
        <div>
          <label for="lb-act" class="mb-1 block text-sm font-medium">Activities performed</label>
          <textarea id="lb-act" v-model="form.activities" required rows="3" class="field"></textarea>
        </div>
        <div>
          <label for="lb-chal" class="mb-1 block text-sm font-medium">Challenges encountered</label>
          <textarea id="lb-chal" v-model="form.challenges" required rows="2" class="field"></textarea>
        </div>
        <div>
          <label for="lb-less" class="mb-1 block text-sm font-medium">Lessons learned</label>
          <textarea id="lb-less" v-model="form.lessons" required rows="2" class="field"></textarea>
        </div>
        <p v-if="msg" role="status" class="text-sm" :class="ok ? 'text-seal-green' : 'form-error'">{{ msg }}</p>
        <button class="btn-primary self-start" :disabled="busy">{{ busy ? 'Filing…' : 'File as draft' }}</button>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import BackButton from '../components/BackButton.vue'
import EmptyState from '../components/EmptyState.vue'
import StatusSeal from '../components/StatusSeal.vue'
import { createLogbook, errMsg, fmtDate, listLogbook, type LogbookEntry } from '../api/client'

const loading = ref(true)
const busy = ref(false)
const error = ref('')
const msg = ref('')
const ok = ref(false)
const entries = ref<LogbookEntry[]>([])
const form = reactive({ weekNumber: 1, startDate: '', endDate: '', activities: '', challenges: '', lessons: '' })

const maxWeek = computed(() =>
  entries.value.length ? Math.max(...entries.value.map((e) => e.weekNumber)) + 1 : 1
)
const today = computed(() => {
  const d = new Date()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
})

async function load() {
  try {
    const { data } = await listLogbook()
    entries.value = Array.isArray(data) ? [...data].sort((a, b) => a.weekNumber - b.weekNumber) : []
    if (!entries.value.length) form.weekNumber = 1
    else form.weekNumber = Math.max(...entries.value.map((e) => e.weekNumber)) + 1
  } catch (e: unknown) {
    error.value = errMsg(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function onCreate() {
  msg.value = ''
  ok.value = false
  if (form.weekNumber > maxWeek.value) {
    msg.value = `Week ${form.weekNumber} has not started yet. You can file up to week ${maxWeek.value}.`
    return
  }
  if (form.startDate > today.value || form.endDate > today.value) {
    msg.value = 'Logbook dates cannot be in the future.'
    return
  }
  busy.value = true
  try {
    await createLogbook({ ...form })
    ok.value = true
    msg.value = 'Week filed as a draft.'
    await load()
  } catch (e: unknown) {
    msg.value = errMsg(e)
  } finally {
    busy.value = false
  }
}
</script>
