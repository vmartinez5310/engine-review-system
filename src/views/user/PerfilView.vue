<script setup>
import { computed } from 'vue'
import { authState } from '../../composables/useAuth'

const user = computed(() => authState.user || {})

const initials = computed(() => {
  const n = user.value.nombre || 'U'
  return n.substring(0, 2).toUpperCase()
})

const avatarUrl = computed(() => {
  const u = (user.value.logo || '').trim()
  return /^https?:\/\//i.test(u) ? u : null
})
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-lg mx-auto pb-10">
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div class="bg-brand/10 dark:bg-brand/5 px-6 py-8 flex flex-col items-center gap-3">
          <div class="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-white dark:ring-slate-800 overflow-hidden">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="user.nombre"
              class="w-full h-full object-cover"
              @error="$event.target.style.display='none'"
            />
            <template v-else>{{ initials }}</template>
          </div>
          <div class="text-center">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white">{{ user.nombre || 'Usuario' }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ user.email }}</p>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
            <span class="text-sm text-slate-500">Rol</span>
            <span class="text-sm font-semibold uppercase tracking-wide text-brand">{{ user.rol || 'USUARIO' }}</span>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
            <span class="text-sm text-slate-500">Estado</span>
            <StatusBadge :status="user.estado || 'Activo'" />
          </div>
          <div class="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
            <span class="text-sm text-slate-500">ID</span>
            <span class="text-sm font-mono text-slate-600 dark:text-slate-300">{{ user.userId || '—' }}</span>
          </div>

          <div class="pt-4">
            <p class="text-xs text-slate-400 text-center leading-relaxed">
              El acceso a este sistema se realiza mediante codigo OTP enviado a tu correo.
              No es necesario (ni posible) cambiar una contrasena.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
