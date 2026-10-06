<template>
  <div class="mx-auto max-w-lg">
    <BackButton />
    <h1 class="font-display text-3xl font-semibold">Student profile</h1>
    <p class="mb-6 mt-1 text-ink-mute">These details identify you to your supervisor. Keep them current.</p>
    <p v-if="loading" class="text-ink-mute">Loading…</p>
    <form v-else class="ledger flex flex-col gap-4 p-6" novalidate @submit.prevent="onSave">
      <div>
        <label for="profile-name" class="mb-1 block text-sm font-medium">Full name</label>
        <input id="profile-name" v-model="form.fullName" name="name" type="text" required autocomplete="name" class="field" />
      </div>
      <div>
        <label for="profile-reg" class="mb-1 block text-sm font-medium">Registration number</label>
        <input id="profile-reg" v-model="form.registrationNumber" name="regnumber" type="text" required autocomplete="off" spellcheck="false" pattern="\d{2}/SC/CO/\d{3}" title="e.g. 23/SC/CO/044" class="field uppercase" />
      </div>
      <div>
        <label for="profile-phone" class="mb-1 block text-sm font-medium">Phone</label>
        <input id="profile-phone" v-model="form.phone" name="tel" type="tel" autocomplete="tel" class="field" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="profile-dept" class="mb-1 block text-sm font-medium">Department</label>
          <input id="profile-dept" v-model="form.department" name="department" type="text" autocomplete="off" class="field" />
        </div>
        <div>
          <label for="profile-faculty" class="mb-1 block text-sm font-medium">Faculty</label>
          <input id="profile-faculty" v-model="form.faculty" name="faculty" type="text" autocomplete="off" class="field" />
        </div>
      </div>
      <p v-if="msg" role="status" class="text-sm" :class="ok ? 'text-seal-green' : 'form-error'">{{ msg }}</p>
      <button class="btn-primary self-start" :disabled="busy">{{ busy ? 'Saving…' : 'Save profile' }}</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import BackButton from '../components/BackButton.vue'
import { errMsg, getProfile, updateProfile } from '../api/client'

const loading = ref(true)
const busy = ref(false)
const msg = ref('')
const ok = ref(false)
const form = reactive({ fullName: '', registrationNumber: '', phone: '', department: '', faculty: '' })

onMounted(async () => {
  try {
    const { data } = await getProfile()
    Object.assign(form, {
      fullName: data.fullName ?? '',
      registrationNumber: data.registrationNumber ?? '',
      phone: data.phone ?? '',
      department: data.department ?? '',
      faculty: data.faculty ?? '',
    })
  } catch (e: unknown) {
    msg.value = errMsg(e)
  } finally {
    loading.value = false
  }
})

async function onSave() {
  msg.value = ''
  ok.value = false
  busy.value = true
  try {
    await updateProfile({ ...form })
    ok.value = true
    msg.value = 'Profile saved.'
  } catch (e: unknown) {
    msg.value = errMsg(e)
  } finally {
    busy.value = false
  }
}
</script>
