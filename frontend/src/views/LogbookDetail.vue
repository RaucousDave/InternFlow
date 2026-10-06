<template>
  <div class="mx-auto max-w-2xl">
    <BackButton fallback="/logbook" label="Back to the ledger" />
    <div class="mb-6 mt-2 flex flex-wrap items-center gap-3">
      <h1 class="tabular font-display text-3xl font-semibold">
        Week {{ entry?.weekNumber }}
      </h1>
      <StatusSeal v-if="entry" :status="entry.status" />
    </div>
    <p v-if="loading" class="text-ink-mute">Loading…</p>
    <p v-else-if="error" role="alert" class="text-sm form-error">
      {{ error }}
    </p>
    <template v-else-if="entry">
      <form
        v-if="editable"
        class="ledger flex flex-col gap-4 p-6"
        novalidate
        @submit.prevent="onSave"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="le-start" class="mb-1 block text-sm font-medium"
              >Start date</label
            >
            <input
              id="le-start"
              v-model="entry.startDate"
              type="date"
              required
              class="field"
            />
          </div>
          <div>
            <label for="le-end" class="mb-1 block text-sm font-medium"
              >End date</label
            >
            <input
              id="le-end"
              v-model="entry.endDate"
              type="date"
              required
              class="field"
            />
          </div>
        </div>
        <div>
          <label for="le-act" class="mb-1 block text-sm font-medium"
            >Activities performed</label
          >
          <textarea
            id="le-act"
            v-model="entry.activities"
            required
            rows="4"
            class="field"
          ></textarea>
        </div>
        <div>
          <label for="le-chal" class="mb-1 block text-sm font-medium"
            >Challenges encountered</label
          >
          <textarea
            id="le-chal"
            v-model="entry.challenges"
            required
            rows="3"
            class="field"
          ></textarea>
        </div>
        <div>
          <label for="le-less" class="mb-1 block text-sm font-medium"
            >Lessons learned</label
          >
          <textarea
            id="le-less"
            v-model="entry.lessons"
            required
            rows="3"
            class="field"
          ></textarea>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="btn-primary" :disabled="busy">
            {{ busy ? "Saving…" : "Save draft" }}
          </button>
          <button
            type="button"
            class="btn-quiet"
            :disabled="busy"
            @click="onSubmit"
          >
            Submit for review
          </button>
        </div>
        <p class="text-xs text-ink-mute">
          Submitting locks the entry — it cannot be edited afterwards.
        </p>
      </form>
      <div v-else class="ledger flex flex-col gap-4 p-6">
        <p class="tabular text-sm text-ink-mute">
          {{ fmtDate(entry.startDate) }} → {{ fmtDate(entry.endDate) }}
        </p>
        <div>
          <p class="text-sm font-medium uppercase tracking-wide text-ink-mute">
            Activities
          </p>
          <p class="mt-1 whitespace-pre-wrap">{{ entry.activities }}</p>
        </div>
        <div>
          <p class="text-sm font-medium uppercase tracking-wide text-ink-mute">
            Challenges
          </p>
          <p class="mt-1 whitespace-pre-wrap">{{ entry.challenges }}</p>
        </div>
        <div>
          <p class="text-sm font-medium uppercase tracking-wide text-ink-mute">
            Lessons
          </p>
          <p class="mt-1 whitespace-pre-wrap">{{ entry.lessons }}</p>
        </div>
      </div>
      <p
        v-if="msg"
        role="status"
        class="mt-3 text-sm"
        :class="ok ? 'text-seal-green' : 'form-error'"
      >
        {{ msg }}
      </p>
      <section
        v-if="thread.length"
        aria-label="Supervisor feedback"
        class="mt-8"
      >
        <h2 class="mb-3 font-display text-2xl font-semibold">
          Supervisor notes
        </h2>
        <div v-for="f in thread" :key="f.id" class="ledger mb-2 p-4">
          <p>{{ f.body }}</p>
          <p class="mt-1 text-xs text-ink-mute">{{ f.createdAt ?? "" }}</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import BackButton from "../components/BackButton.vue";
import StatusSeal from "../components/StatusSeal.vue";
import {
  errMsg,
  fmtDate,
  getLogbook,
  listFeedback,
  submitLogbook,
  updateLogbook,
  type FeedbackItem,
  type LogbookEntry,
} from "../api/client";

const route = useRoute();
const id = String(route.params.id ?? '');
const loading = ref(true);
const busy = ref(false);
const error = ref("");
const msg = ref("");
const ok = ref(false);
const entry = ref<LogbookEntry | null>(null);
const thread = ref<FeedbackItem[]>([]);
const editable = computed(() => entry.value?.status === "DRAFT");

onMounted(async () => {
  try {
    const [{ data }, fb] = await Promise.all([
      getLogbook(id),
      listFeedback().catch(() => ({ data: [] as FeedbackItem[] })),
    ]);
    entry.value = data;
    const items = Array.isArray(fb.data) ? fb.data : [];
    thread.value = items.filter((f) => f.logbookEntryId === id);
  } catch (e: unknown) {
    error.value = errMsg(e);
  } finally {
    loading.value = false;
  }
});

async function onSave() {
  if (!entry.value?.id) return;
  msg.value = "";
  ok.value = false;
  busy.value = true;
  try {
    await updateLogbook(entry.value.id, { ...entry.value });
    ok.value = true;
    msg.value = "Draft saved.";
  } catch (e: unknown) {
    msg.value = errMsg(e);
  } finally {
    busy.value = false;
  }
}

async function onSubmit() {
  if (!entry.value?.id) return;
  if (
    !confirm(
      "Submit this week for review? It locks and cannot be edited afterwards.",
    )
  )
    return;
  msg.value = "";
  ok.value = false;
  busy.value = true;
  try {
    await submitLogbook(entry.value.id);
    entry.value.status = "SUBMITTED";
    ok.value = true;
    msg.value = "Submitted and locked.";
  } catch (e: unknown) {
    msg.value = errMsg(e);
  } finally {
    busy.value = false;
  }
}
</script>
