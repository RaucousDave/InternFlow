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
      <h2 class="mb-3 mt-8 font-display text-2xl font-semibold">File a placement</h2>
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
            {{ busy ? "Saving…" : "File record" }}
          </button>
        </div>
      </form>
    </template>
    <div
      v-if="editing"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-label="Edit placement"
    >
      <div class="absolute inset-0 bg-black/60" @click="closeEdit"></div>
      <div class="ledger relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <h2 class="mb-1 font-display text-2xl font-semibold">Edit placement</h2>
        <p class="mb-4 text-sm text-ink-mute">Changes save to this record only.</p>
        <form class="flex flex-col gap-4" novalidate @submit.prevent="onUpdate">
          <div>
            <label for="epl-org" class="mb-1 block text-sm font-medium">Organization / company name</label>
            <input id="epl-org" v-model="editForm.orgName" type="text" required autocomplete="organization" class="field" />
          </div>
          <div>
            <label for="epl-addr" class="mb-1 block text-sm font-medium">Organization address</label>
            <input id="epl-addr" v-model="editForm.orgAddress" type="text" required autocomplete="off" class="field" />
          </div>
          <div>
            <label for="epl-role" class="mb-1 block text-sm font-medium">Position / role</label>
            <input id="epl-role" v-model="editForm.position" type="text" required autocomplete="off" class="field" />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="epl-start" class="mb-1 block text-sm font-medium">Start date</label>
              <input id="epl-start" v-model="editForm.startDate" type="date" required class="field" />
            </div>
            <div>
              <label for="epl-end" class="mb-1 block text-sm font-medium">End date</label>
              <input id="epl-end" v-model="editForm.endDate" type="date" required class="field" />
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="epl-sup" class="mb-1 block text-sm font-medium">Industry supervisor name</label>
              <input id="epl-sup" v-model="editForm.industrySupervisorName" type="text" required autocomplete="off" class="field" />
            </div>
            <div>
              <label for="epl-supc" class="mb-1 block text-sm font-medium">Industry supervisor contact</label>
              <input id="epl-supc" v-model="editForm.industrySupervisorContact" type="text" required autocomplete="off" class="field" />
            </div>
          </div>
          <p v-if="editMsg" role="status" class="text-sm form-error">{{ editMsg }}</p>
          <div class="flex gap-3">
            <button class="btn-primary" :disabled="editBusy">{{ editBusy ? "Saving…" : "Update record" }}</button>
            <button type="button" class="btn-quiet" @click="closeEdit">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
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
const editing = ref<Placement | null>(null);
const editBusy = ref(false);
const editMsg = ref("");
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
const editForm = reactive(blank());

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

onMounted(() => {
  load();
  window.addEventListener("keydown", onKey);
});
onUnmounted(() => window.removeEventListener("keydown", onKey));

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape" && editing.value) closeEdit();
}

function edit(pl: Placement) {
  editing.value = pl;
  editMsg.value = "";
  Object.assign(editForm, { ...blank(), ...pl });
  nextTick(() => document.getElementById("epl-org")?.focus());
}

function closeEdit() {
  editing.value = null;
  Object.assign(editForm, blank());
  editMsg.value = "";
}

async function onSave() {
  msg.value = "";
  ok.value = false;
  busy.value = true;
  try {
    await createPlacement({ ...form });
    ok.value = true;
    msg.value = "Placement filed.";
    Object.assign(form, blank());
    await load();
  } catch (e: unknown) {
    msg.value = errMsg(e);
  } finally {
    busy.value = false;
  }
}

async function onUpdate() {
  if (!editing.value?.id) return;
  editMsg.value = "";
  editBusy.value = true;
  try {
    await updatePlacement(editing.value.id, { ...editForm });
    closeEdit();
    await load();
  } catch (e: unknown) {
    editMsg.value = errMsg(e);
  } finally {
    editBusy.value = false;
  }
}
</script>
