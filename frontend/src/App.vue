<template>
  <div class="min-h-screen">
    <a href="#main" class="skip-link">Skip to main content</a>
    <header class="border-b border-ledger bg-paper">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <RouterLink to="/" class="font-display text-2xl font-semibold tracking-tight text-navy">
          InternFlow
        </RouterLink>
        <nav class="flex items-center gap-5 text-sm font-medium" aria-label="Primary">
          <template v-if="authed">
            <RouterLink v-if="isStudent" to="/logbook" class="text-ink-soft hover:text-ink">Logbook</RouterLink>
            <RouterLink v-if="isStudent" to="/progress" class="text-ink-soft hover:text-ink">Progress</RouterLink>
            <RouterLink v-if="isSupervisor" to="/admin" class="text-ink-soft hover:text-ink">Records office</RouterLink>
            <button class="text-ink-soft hover:text-ink" @click="onLogout">Sign out</button>
          </template>
          <RouterLink v-else to="/login" class="text-ink-soft hover:text-ink">Sign in</RouterLink>
          <button
            :aria-pressed="isDark"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            class="rounded-md border border-ledger p-2 text-ink-soft transition-colors duration-150 hover:text-ink"
            @click="toggleTheme"
          >
            <svg v-if="isDark" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="3.2" stroke="currentColor" stroke-width="1.5" />
              <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
    <main id="main" class="mx-auto max-w-5xl px-4 py-8">
      <RouterView />
    </main>
    <footer class="mx-auto max-w-5xl px-4 pb-8 text-xs text-ink-mute">
      InternFlow — SIWES placement records, from placement to completion.
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getRole, logout } from './api/client'

const router = useRouter()
const authed = ref(!!getRole())
const role = ref(getRole())
const isStudent = ref(role.value === 'STUDENT')
const isSupervisor = ref(role.value === 'SUPERVISOR')
const isDark = ref(false)

function applyTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem('internflow.theme', dark ? 'dark' : 'light')
  } catch {
    /* private mode: theme just won't persist */
  }
  const meta = document.querySelector('meta#theme-color')
  meta?.setAttribute('content', dark ? '#10151d' : '#FAF8F3')
}

function toggleTheme() {
  applyTheme(!isDark.value)
}

try {
  const saved = localStorage.getItem('internflow.theme')
  applyTheme(
    saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
} catch {
  /* private mode */
}

function sync() {
  role.value = getRole()
  authed.value = !!role.value
  isStudent.value = role.value === 'STUDENT'
  isSupervisor.value = role.value === 'SUPERVISOR'
}

router.afterEach(sync)

async function onLogout() {
  await logout()
  sync()
  router.push('/login')
}
</script>
