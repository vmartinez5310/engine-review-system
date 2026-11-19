<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }
})

const statusConfig = computed(() => {
  const s = String(props.status || '').toLowerCase().trim()

  if (['activo', 'aprobado', 'completado', 'usado'].includes(s)) {
    return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/50'
  }
  if (['pendiente', 'en espera', 'revisión', 'expirado'].includes(s)) {
    return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50'
  }
  if (['revocado', 'rechazado', 'error', 'cancelado', 'archivado', 'suspendido'].includes(s)) {
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/50'
  }
  return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50'
})

const label = computed(() => {
  const s = String(props.status || '').trim()
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
})
</script>

<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', statusConfig]">
    {{ label }}
  </span>
</template>
