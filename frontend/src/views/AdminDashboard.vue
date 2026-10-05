<template>
  <div class="mx-auto max-w-4xl">
    <h1 class="font-display text-3xl font-semibold">Records office</h1>
    <p class="mb-6 mt-1 text-ink-mute">Every student, every week, every sign-off — at a glance.</p>
    <p v-if="loading" class="text-ink-mute">Loading…</p>
    <p v-else-if="error" role="alert" class="text-sm form-error">{{ error }}</p>
    <template v-else>
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="ledger px-5 py-4">
          <p class="tabular font-display text-4xl font-semibold text-navy">{{ students.length }}</p>
          <p class="mt-1 text-sm text-ink-mute">Students on record</p>
        </div>
        <div class="ledger px-5 py-4">
          <p class="tabular font-display text-4xl font-semibold text-seal-amber">{{ pending }}</p>
          <p class="mt-1 text-sm text-ink-mute">Weeks awaiting review</p>
        </div>
        <div class="ledger px-5 py-4">
          <p class="tabular font-display text-4xl font-semibold text-seal-green">{{ reviewed }}</p>
          <p class="mt-1 text-sm text-ink-mute">Weeks reviewed</p>
        </div>
        <div class="ledger px-5 py-4">
          <p class="tabular font-display text-4xl font-semibold">{{ attention }}</p>
          <p class="mt-1 text-sm text-ink-mute">Students with no filing</p>
        </div>
      </div>
      <h2 class="mb-3 font-display text-2xl font-semibold">Student register</h2>
      <table class="ledger w-full text-left text-sm">
        <caption class="sr-only">Registered students and their filing counts</caption>
        <thead>
          <tr class="border-b border-ledger text-xs uppercase tracking-wide text-ink-mute">
            <th scope="col" class="p-3 font-medium">Name</th>
            <th scope="col" class="p-3 font-medium">Reg. number</th>
            <th scope="col" class="tabular p-3 font-medium">Weeks filed</th>
            <th scope="col" class="p-3 font-medium"><span class="sr-only">Open record</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in students" :key="s.id" class="border-b border-ledger last:border-0">
            <td class="p-3 font-medium">{{ s.fullName ?? s.name ?? ('#' + s.id) }}</td>
            <td class="p-3 text-ink-soft">{{ s.registrationNumber ?? '—' }}</td>
            <td class="tabular p-3">{{ submittedCount(s.id) }}</td>
            <td class="p-3 text-right">
              <RouterLink :to="`/admin/students/${s.id}`" class="font-medium text-navy underline">Open record</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
      <h2 class="mb-3 mt-8 font-display text-2xl font-semibold">Latest filings</h2>
      <ul v-if="recent.length" class="ledger divide-y divide-ledger">
        <li v-for="e in recent" :key="e.logbookId + '-' + e.studentId" class="flex flex-wrap items-center gap-2 p-3 text-sm">
          <span class="font-medium">{{ e.studentName }}</span>
          <span class="tabular text-ink-soft">week {{ e.weekNumber }}</span>
          <StatusSeal :status="e.status" />
        </li>
      </ul>
      <EmptyState v-else title="Nothing filed yet" body="Submitted weeks will appear here for review." />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import StatusSeal from '../components/StatusSeal.vue'
import { errMsg, getStudentLogbook, listStudents } from '../api/client'

interface Row {
  id: string
  fullName?: string
  name?: string
  registrationNumber?: string
}
interface Filed {
  logbookId: string
  studentId: string
  studentName: string
  weekNumber: number
  status: string
}

const loading = ref(true)
const error = ref('')
const students = ref<Row[]>([])
const byStudent = ref<Record<string, { status: string }[]>>({})

onMounted(async () => {
  try {
    const { data } = await listStudents()
    students.value = Array.isArray(data) ? data : []
    const pairs = await Promise.all(
      students.value.map(async (s) => {
        try {
          const r = await getStudentLogbook(s.id)
          return [s.id, Array.isArray(r.data) ? r.data : []] as const
        } catch {
          return [s.id, []] as const
        }
      })
    )
    byStudent.value = Object.fromEntries(pairs)
  } catch (e: unknown) {
    error.value = errMsg(e)
  } finally {
    loading.value = false
  }
})

const allEntries = computed<Filed[]>(() => {
  const out: Filed[] = []
  for (const s of students.value) {
    for (const [i, e] of (byStudent.value[s.id] ?? []).entries()) {
      const r = e as { id?: string; weekNumber?: number; status?: string }
      out.push({
        logbookId: r.id ?? `${s.id}-${i}`,
        studentId: s.id,
        studentName: s.fullName ?? s.name ?? '#' + s.id,
        weekNumber: r.weekNumber ?? 0,
        status: r.status ?? 'SUBMITTED',
      })
    }
  }
  return out
})
const submittedCount = (id: string) => (byStudent.value[id] ?? []).filter((e) => e.status !== 'DRAFT').length
const pending = computed(() => allEntries.value.filter((e) => e.status === 'SUBMITTED').length)
const reviewed = computed(() => allEntries.value.filter((e) => e.status === 'REVIEWED').length)
const attention = computed(() => students.value.filter((s) => submittedCount(s.id) === 0).length)
const recent = computed(() => [...allEntries.value].filter((e) => e.status !== 'DRAFT').slice(-8).reverse())
</script>
