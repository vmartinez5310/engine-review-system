<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }
})

const statusConfig = computed(() => {
  const s = String(props.status || '').toUpperCase().trim()

  if (['ACTIVO', 'APROBADO', 'COMPLETADO', 'USADO'].includes(s)) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
  }
  if (['PENDIENTE', 'EN ESPERA', 'REVISIÓN', 'EXPIRADO'].includes(s)) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
  }
  if (['REVOCADO', 'RECHAZADO', 'ERROR', 'CANCELADO', 'ARCHIVADO', 'SUSPENDIDO'].includes(s)) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
  }
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
})
</script>

<template>
  <span :class="['px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase', statusConfig]">
    {{ status }}
  </span>
</template>
