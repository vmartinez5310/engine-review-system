<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }
})

// Mapeo universal de estados a colores
const statusConfig = computed(() => {
  const s = props.status.toUpperCase()
  
  // Estados de ÉXITO (Verdes)
  if (['ACTIVO', 'APROBADO', 'COMPLETADO'].includes(s)) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
  }
  
  // Estados de ADVERTENCIA (Amarillos/Naranjas)
  if (['PENDIENTE', 'EN ESPERA', 'REVISIÓN'].includes(s)) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
  }

  // Estados de PELIGRO (Rojos)
  if (['REVOCADO', 'RECHAZADO', 'ERROR'].includes(s)) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
  }

  // ESTADOS NEUTROS (Grises - Default)
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
})
</script>

<template>
  <span :class="['px-3 py-1 rounded-full text-[11px] font-bold tracking-wide', statusConfig]">
    {{ status }}
  </span>
</template>