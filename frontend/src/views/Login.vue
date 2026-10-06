<template>
  <div class="mx-auto max-w-sm">
    <h1 class="mb-1 font-display text-3xl font-semibold">Sign in</h1>
    <p class="mb-6 text-sm text-ink-mute">Students use their registered email; supervisors use a department-issued account.</p>
    <form class="ledger flex flex-col gap-4 p-6" novalidate @submit.prevent="onLogin">
      <div>
        <label for="login-email" class="mb-1 block text-sm font-medium">Email</label>
        <input
          id="login-email" v-model="email" name="email" type="email" required
          autocomplete="email" spellcheck="false" placeholder="you@example.com…"
          class="field" :aria-describedby="error ? 'login-error' : undefined"
        />
      </div>
      <div>
        <label for="login-password" class="mb-1 block text-sm font-medium">Password</label>
        <PasswordField
          id="login-password" v-model="password" name="password"
          autocomplete="current-password" placeholder="Your password…"
          required :describedby="error ? 'login-error' : undefined"
        />
      </div>
      <p v-if="error" id="login-error" role="alert" class="text-sm form-error">{{ error }}</p>
      <button class="btn-primary" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
    </form>
    <p class="mt-4 text-sm text-ink-soft">New student? <RouterLink to="/register" class="font-medium text-navy underline">Create an account</RouterLink></p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PasswordField from '../components/PasswordField.vue'
import { getRole, login } from '../api/client'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function onLogin() {
  error.value = ''
  busy.value = true
  try {
    await login({ email: email.value, password: password.value })
    router.push(getRole() === 'SUPERVISOR' ? '/admin' : '/')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Sign-in failed. Check your details and try again.'
  } finally {
    busy.value = false
  }
}
</script>
