<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../../services/api'
import SkeletonBlock from '../../components/ui/SkeletonBlock.vue'

defineProps({ config: { type: Object, default: () => ({}) } })

const isLoading = ref(true)
const lastUpdated = ref('')

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

const approvalRate = computed(() => {
  if (!kpis.value.totalResenas) return 0
  return Math.round((kpis.value.aprobadas / kpis.value.totalResenas) * 100)
})

const pendingRate = computed(() => {
  if (!kpis.value.totalResenas) return 0
  return Math.round((kpis.value.pendientes / kpis.value.totalResenas) * 100)
})

const conversionRate = computed(() => {
  if (!kpis.value.tokensTotal) return 0
  return Math.round((kpis.value.tokensUsados / kpis.value.tokensTotal) * 100)
})

const secondaryCards = computed(() => [
  {
    key: 'totalResenas',
    label: 'Volumen de Reseñas',
    value: kpis.value.totalResenas ?? 0,
    subtext: 'Histórico acumulado',
    icon: 'fas fa-layer-group',
    accent: 'from-amber-500/15 to-transparent',
    iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    borderHover: 'hover:border-amber-500/40'
  },
  {
    key: 'aprobadas',
    label: 'Reseñas Publicadas',
    value: kpis.value.aprobadas ?? 0,
    subtext: `${approvalRate.value}% del volumen total`,
    badge: `${approvalRate.value}%`,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    icon: 'fas fa-check-circle',
    accent: 'from-emerald-500/15 to-transparent',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    borderHover: 'hover:border-emerald-500/40'
  },
  {
    key: 'pendientes',
    label: 'En Cola de Auditoría',
    value: kpis.value.pendientes ?? 0,
    subtext: kpis.value.pendientes > 0 ? 'Requieren revisión manual' : 'Bandeja al día',
    badge: kpis.value.pendientes > 0 ? 'Atención' : 'Al día',
    badgeColor: kpis.value.pendientes > 0 
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' 
      : 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    icon: 'fas fa-clock',
    accent: 'from-orange-500/15 to-transparent',
    iconBg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    borderHover: 'hover:border-orange-500/40'
  },
  {
    key: 'tokensActivos',
    label: 'Enlaces en Circulación',
    value: kpis.value.tokensActivos ?? 0,
    subtext: 'Disponibles para clientes',
    icon: 'fas fa-link',
    accent: 'from-sky-500/15 to-transparent',
    iconBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    borderHover: 'hover:border-sky-500/40'
  },
  {
    key: 'tokensTotal',
    label: 'Emisión de Enlaces',
    value: kpis.value.tokensTotal ?? 0,
    subtext: `${kpis.value.tokensUsados ?? 0} canjeados con éxito`,
    badge: `${kpis.value.tokensUsados ?? 0} usados`,
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/25',
    icon: 'fas fa-hashtag',
    accent: 'from-violet-500/15 to-transparent',
    iconBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    borderHover: 'hover:border-violet-500/40'
  },
  {
    key: 'usuariosActivos',
    label: 'Operadores Activos',
    value: kpis.value.usuariosActivos ?? 0,
    subtext: 'Con acceso al sistema',
    icon: 'fas fa-users',
    accent: 'from-indigo-500/15 to-transparent',
    iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    borderHover: 'hover:border-indigo-500/40'
  }
])

async function load() {
  isLoading.value = true
  try {
    kpis.value = await apiClient.post('get_kpis')
    const now = new Date()
    lastUpdated.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-y-auto lg:overflow-hidden pb-6 lg:pb-2 select-none">
    
    <!-- HEADER EJECUTIVO -->
    <div class="shrink-0 flex items-center justify-between gap-4 pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {{ config?.nombre || 'Sistema de Reseñas' }}
          </span>
        </div>
        <div class="flex items-baseline gap-3 mt-0.5">
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Indicadores clave del sistema de reseñas
          </h2>
        </div>
      </div>

      <!-- Botón de sincronización -->
      <div class="flex items-center gap-3 shrink-0">
        <span v-if="lastUpdated" class="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline-block tabular-nums">
          Sincronizado: {{ lastUpdated }}
        </span>
        <button
          @click="load"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <i :class="['fas fa-sync-alt text-slate-400 text-xs', { 'animate-spin text-amber-400': isLoading }]"></i>
          <span class="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </div>

    <!-- SKELETON LOADER (BENTO GRID) -->
    <div v-if="isLoading" class="flex-1 min-h-0">
      <SkeletonBlock variant="bento" />
    </div>

    <!-- BENTO GRID: Altura natural en móvil, estirable al 100% en Desktop -->
    <div v-else class="flex flex-col lg:flex-1 lg:min-h-0 lg:grid lg:grid-rows-12 gap-4">
      
      <!-- NIVEL 1: HERO CARDS -->
      <div class="lg:row-span-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:min-h-0">
        
        <!-- Hero 1: Calificación Media Global -->
        <div class="lg:col-span-7 relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-gradient-to-br from-white via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-amber-950/25 p-5 xl:p-6 shadow-sm flex flex-col justify-between gap-5 lg:gap-2">
          <div class="absolute -right-12 -top-12 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <div class="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <i class="fas fa-crown text-xs text-amber-400"></i>
                </div>
                <span>Calificación Media Global</span>
              </div>
              <div class="mt-3 flex items-baseline gap-3">
                <span class="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                  {{ (kpis.promedio || 0).toFixed(1) }}
                </span>
                <span class="text-sm sm:text-base font-semibold text-slate-400 dark:text-slate-500">/ 5.0 pts</span>
              </div>
            </div>

            <div class="flex flex-col items-start sm:items-end">
              <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shadow-inner">
                <template v-for="star in 5" :key="star">
                  <i
                    class="fas fa-star text-sm sm:text-base"
                    :class="star <= Math.round(kpis.promedio || 0) ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300 dark:text-slate-700'"
                  ></i>
                </template>
              </div>
              <span class="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                Basado en {{ kpis.totalResenas }} evaluaciones
              </span>
            </div>
          </div>

          <div class="relative space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div class="flex items-center gap-5">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span class="text-slate-500 dark:text-slate-400">Publicadas:</span>
                  <strong class="text-slate-900 dark:text-white font-bold tabular-nums">{{ kpis.aprobadas }}</strong>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span class="text-slate-500 dark:text-slate-400">Pendientes:</span>
                  <strong class="text-slate-900 dark:text-white font-bold tabular-nums">{{ kpis.pendientes }}</strong>
                </div>
              </div>
              <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-lg tabular-nums">
                {{ approvalRate }}% Aprobación
              </span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              <div class="h-full bg-emerald-500 rounded-l-full transition-all duration-700" :style="{ width: `${approvalRate}%` }"></div>
              <div class="h-full bg-amber-400 rounded-r-full transition-all duration-700" :style="{ width: `${pendingRate}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Hero 2: Conversión de Enlaces -->
        <div class="lg:col-span-5 relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 xl:p-6 shadow-sm flex flex-col justify-between gap-5 lg:gap-2">
          <div class="absolute -right-12 -bottom-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative flex items-start justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Conversión de Enlaces
              </span>
              <div class="mt-3 flex items-baseline gap-2.5">
                <span class="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                  {{ conversionRate }}%
                </span>
                <span class="text-sm sm:text-base font-medium text-slate-400 dark:text-slate-500">efectividad</span>
              </div>
            </div>
            <div class="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0 shadow-sm">
              <i class="fas fa-chart-line text-sky-400 text-xl xl:text-2xl"></i>
            </div>
          </div>
          <div class="relative space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 tabular-nums">
              <span>Usados: <strong class="text-slate-900 dark:text-white font-bold">{{ kpis.tokensUsados }}</strong></span>
              <span>Activos: <strong class="text-sky-400 font-bold">{{ kpis.tokensActivos }}</strong></span>
              <span>Total: <strong class="text-slate-900 dark:text-white font-bold">{{ kpis.tokensTotal }}</strong></span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div class="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-700" :style="{ width: `${Math.min(conversionRate, 100)}%` }"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- NIVEL 2: MATRIZ OPERATIVA -->
      <div class="lg:row-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:min-h-0">
        <div
          v-for="c in secondaryCards"
          :key="c.key"
          :class="['group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/95 p-5 xl:p-6 flex flex-col justify-between gap-4 lg:gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-slate-950/30', c.borderHover]"
        >
          <div :class="['absolute inset-x-0 top-0 h-16 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none', c.accent]"></div>
          <i :class="[c.icon, 'absolute -right-3 -bottom-3 text-7xl xl:text-8xl opacity-[0.03] dark:opacity-[0.04] pointer-events-none transition-transform duration-500 group-hover:scale-110']"></i>

          <div class="relative flex items-center justify-between gap-3">
            <span class="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
              {{ c.label }}
            </span>
            <div :class="['w-11 h-11 xl:w-13 xl:h-13 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm', c.iconBg]">
              <i :class="[c.icon, 'text-base sm:text-lg xl:text-xl']"></i>
            </div>
          </div>

          <div class="relative flex items-baseline justify-between gap-3 my-auto">
            <p class="text-4xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
              {{ c.value }}
            </p>
            <span v-if="c.badge" :class="['text-xs font-bold px-2.5 py-1 rounded-lg border tabular-nums', c.badgeColor]">
              {{ c.badge }}
            </span>
          </div>

          <div class="relative pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
            <span class="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
              {{ c.subtext }}
            </span>
            <i class="fas fa-arrow-up-right text-[11px] text-slate-300 dark:text-slate-700 group-hover:text-slate-400 transition-colors"></i>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>