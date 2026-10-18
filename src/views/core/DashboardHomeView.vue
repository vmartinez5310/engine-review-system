<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../../services/api'

const isLoading = ref(true)
const kpis = ref({
  totalResenas: 0,
  pendientes: 0,
  aprobadas: 0,
  promedio: 0,
  tokensActivos: 0,
  tokensUsados: 0,
  tokensTotal: 0,
  usuariosActivos: 0
})

const cards = [
  { key: 'totalResenas', label: 'Reseñas totales', icon: 'fas fa-star', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'pendientes', label: 'Pendientes', icon: 'fas fa-clock', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { key: 'aprobadas', label: 'Publicadas', icon: 'fas fa-check-circle', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { key: 'promedio', label: 'Calificación media', icon: 'fas fa-chart-line', color: 'text-brand', bg: 'bg-brand/10' },
  { key: 'tokensActivos', label: 'Enlaces activos', icon: 'fas fa-link', color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10' },
  { key: 'tokensUsados', label: 'Enlaces usados', icon: 'fas fa-check-double', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  { key: 'tokensTotal', label: 'Enlaces generados', icon: 'fas fa-hashtag', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700/40' },
  { key: 'usuariosActivos', label: 'Usuarios activos', icon: 'fas fa-users', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' }
]

async function load() {
  isLoading.value = true
  try {
    kpis.value = await apiClient.post('get_kpis')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="h-full overflow-y-auto pb-8">
    <div class="mb-5">
      <h2 class="text-lg font-bold text-slate-800 dark:text-white">Resumen</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">Indicadores clave del sistema de reseñas</p>
    </div>

    <SkeletonBlock v-if="isLoading" variant="bento" :rows="8" />

    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="c in cards"
        :key="c.key"
        class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ c.label }}</p>
            <p class="mt-1.5 text-2xl font-bold text-slate-800 dark:text-white tabular-nums">
              {{ c.key === 'promedio' ? (kpis.promedio || 0).toFixed(1) : (kpis[c.key] ?? 0) }}
            </p>
          </div>
          <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', c.bg]">
            <i :class="[c.icon, c.color, 'text-sm']"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
