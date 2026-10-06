<template>
  <div class="mx-auto max-w-2xl">
    <BackButton />
    <h1 class="font-display text-3xl font-semibold">Placement</h1>
    <p class="mb-6 mt-1 text-ink-mute">
      Where you served, and who supervised you there.
    </p>
    <p v-if="loading" class="text-ink-mute">Loading…</p>
    <template v-else>
      <div v-for="pl in placements" :key="pl.id" class="ledger mb-3 p-5">
        <p class="font-display text-xl font-semibold">{{ pl.orgName }}</p>
        <p class="mt-1 text-sm text-ink-soft">
          {{ pl.position }} · {{ fmtDate(pl.startDate) }} →
          {{ fmtDate(pl.endDate) }}
        </p>
        <p class="text-sm text-ink-soft">{{ pl.orgAddress }}</p>
        <p class="mt-1 text-sm text-ink-soft">
          Industry supervisor: {{ pl.industrySupervisorName }} ({{
            pl.industrySupervisorContact
          }})
        </p>
        <button class="btn-quiet mt-3 text-sm" @click="edit(pl)">
          Edit this record
        </button>
      </div>
      <h2 class="mb-3 mt-8 font-display text-2xl font-semibold">
        {{ editingId ? "Edit placement" : "File a placement" }}
      </h2>
      <form
        class="ledger flex flex-col gap-4 p-6"
        novalidate
        @submit.prevent="onSave"
      >
        <div>
          <label for="pl-org" class="mb-1 block text-sm font-medium"
            >Organization / company name</label
          >
          <input
            id="pl-org"
            v-model="form.orgName"
            type="text"
            required
            autocomplete="organization"
            class="field"
          />
        </div>
        <div>
          <label for="pl-addr" class="mb-1 block text-sm font-medium"
            >Organization address</label
          >
          <input
            id="pl-addr"
            v-model="form.orgAddress"
            type="text"
            required
            autocomplete="off"
            class="field"
          />
        </div>
        <div>
          <label for="pl-role" class="mb-1 block text-sm font-medium"
            >Position / role</label
          >
          <input
            id="pl-role"
            v-model="form.position"
            type="text"
            required
            autocomplete="off"
            class="field"
          />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="pl-start" class="mb-1 block text-sm font-medium"
              >Start date</label
            >
            <input
              id="pl-start"
              v-model="form.startDate"
              type="date"
              required
              class="field"
            />
          </div>
          <div>
            <label for="pl-end" class="mb-1 block text-sm font-medium"
              >End date</label
            >
            <input
              id="pl-end"
              v-model="form.endDate"
              type="date"
              required
              class="field"
            />
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="pl-sup" class="mb-1 block text-sm font-medium"
              >Industry supervisor name</label
            >
            <input
              id="pl-sup"
              v-model="form.industrySupervisorName"
              type="text"
              required
              autocomplete="off"
              class="field"
            />
          </div>
          <div>
            <label for="pl-supc" class="mb-1 block text-sm font-medium"
              >Industry supervisor contact</label
            >
            <input
              id="pl-supc"
              v-model="form.industrySupervisorContact"
              type="text"
              required
              autocomplete="off"
              class="field"
            />
          </div>
        </div>
        <p
          v-if="msg"
          role="status"
          class="text-sm"
          :class="ok ? 'text-seal-green' : 'form-error'"
        >
          {{ msg }}
        </p>
        <div class="flex gap-3">
          <button class="btn-primary" :disabled="busy">
            {{ busy ? "Saving…" : editingId ? "Update record" : "File record" }}
          </button>
          <button
            v-if="editingId"
            type="button"
            class="btn-quiet"
            @click="reset"
          >
            Cancel
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import BackButton from "../components/BackButton.vue";
import {
  createPlacement,
  errMsg,
  fmtDate,
  listPlacements,
  updatePlacement,
  type Placement,
} from "../api/client";

const loading = ref(true);
const busy = ref(false);
const msg = ref("");
const ok = ref(false);
const editingId = ref<string | null>(null);
const placements = ref<Placement[]>([]);
const blank = () => ({
  orgName: "",
  orgAddress: "",
  position: "",
  startDate: "",
  endDate: "",
  industrySupervisorName: "",
  industrySupervisorContact: "",
});
const form = reactive(blank());

async function load() {
  try {
    const { data } = await listPlacements();
    placements.value = Array.isArray(data) ? data : [];
  } catch (e: unknown) {
    msg.value = errMsg(e);
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function edit(pl: Placement) {
  editingId.value = pl.id ?? null;
  Object.assign(form, { ...blank(), ...pl });
  document.getElementById("pl-org")?.focus();
}

function reset() {
  editingId.value = null;
  Object.assign(form, blank());
}

async function onSave() {
  msg.value = "";
  ok.value = false;
  busy.value = true;
  try {
    if (editingId.value) await updatePlacement(editingId.value, { ...form });
    else await createPlacement({ ...form });
    ok.value = true;
    msg.value = editingId.value ? "Record updated." : "Placement filed.";
    reset();
    await load();
  } catch (e: unknown) {
    msg.value = errMsg(e);
  } finally {
    busy.value = false;
  }
}
</script>
