<template>
  <div class="mx-auto max-w-sm">
    <h1 class="mb-1 font-display text-3xl font-semibold">
      Create a student account
    </h1>
    <p class="mb-6 text-sm text-ink-mute">
      Your registration number must match department records (e.g.
      23/SC/CO/044).
    </p>
    <form
      class="ledger flex flex-col gap-4 p-6"
      novalidate
      @submit.prevent="onRegister"
    >
      <div>
        <label for="reg-name" class="mb-1 block text-sm font-medium"
          >Full name</label
        >
        <input
          id="reg-name"
          v-model="form.name"
          name="name"
          type="text"
          required
          autocomplete="name"
          placeholder="Sunday Sophia Ime…"
          class="field"
        />
      </div>
      <div>
        <label for="reg-email" class="mb-1 block text-sm font-medium"
          >Email</label
        >
        <input
          id="reg-email"
          v-model="form.email"
          name="email"
          type="email"
          required
          autocomplete="email"
          spellcheck="false"
          placeholder="you@example.com…"
          class="field"
        />
      </div>
      <div>
        <label for="reg-password" class="mb-1 block text-sm font-medium"
          >Password</label
        >
        <PasswordField
          id="reg-password"
          v-model="form.password"
          name="new-password"
          required
          minlength="8"
          autocomplete="new-password"
          placeholder="At least 8 characters…"
        />
      </div>
      <div>
        <label for="reg-number" class="mb-1 block text-sm font-medium"
          >Registration number</label
        >
        <input
          id="reg-number"
          v-model="form.registrationNumber"
          name="regnumber"
          type="text"
          required
          autocomplete="off"
          spellcheck="false"
          placeholder="23/SC/CO/044…"
          class="field uppercase"
          :aria-describedby="regError ? 'reg-number-error' : undefined"
        />
        <p
          v-if="regError"
          id="reg-number-error"
          role="alert"
          class="mt-1 text-sm form-error"
        >
          {{ regError }}
        </p>
      </div>
      <p v-if="error" role="alert" class="text-sm form-error">{{ error }}</p>
      <button class="btn-primary" :disabled="busy">
        {{ busy ? "Creating account…" : "Create account" }}
      </button>
    </form>
    <p class="mt-4 text-sm text-ink-soft">
      Already registered?
      <RouterLink to="/login" class="font-medium text-navy underline"
        >Sign in</RouterLink
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import PasswordField from "../components/PasswordField.vue";
import { errMsg, getRole, register } from "../api/client";

const router = useRouter();
const form = reactive({
  name: "",
  email: "",
  password: "",
  registrationNumber: "",
});
const error = ref("");
const regError = ref("");
const busy = ref(false);
const REG_RE = /^\d{2}\/SC\/CO\/\d{3}$/;

async function onRegister() {
  error.value = "";
  regError.value = "";
  const num = form.registrationNumber.trim().toUpperCase();
  if (!REG_RE.test(num)) {
    regError.value = "Use the department format, e.g. 23/SC/CO/044.";
    document.getElementById("reg-number")?.focus();
    return;
  }
  busy.value = true;
  try {
    await register({ ...form, registrationNumber: num });
    router.push(getRole() === "SUPERVISOR" ? "/admin" : "/");
  } catch (e: unknown) {
    error.value = errMsg(e);
  } finally {
    busy.value = false;
  }
}
</script>
