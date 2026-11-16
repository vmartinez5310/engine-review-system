<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { cacheStorage } from '../../utils/cache'
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

const conversionRate = computed(() => {
  if (!kpis.value.tokensTotal) return 0
  return Math.round((kpis.value.tokensUsados / kpis.value.tokensTotal) * 100)
})

const secondaryCards = computed(() => [
  {
    key: 'totalResenas',
    label: 'Volumen de Reseñas',
    value: kpis.value.totalResenas,
    subtext: 'Histórico acumulado',
    icon: 'fas fa-layer-group',
    iconBg: 'bg-amber-500/10 text-amber-500'
  },
  {
    key: 'aprobadas',
    label: 'Reseñas Publicadas',
    value: kpis.value.aprobadas,
    subtext: `${approvalRate.value}% del volumen total`,
    icon: 'fas fa-check-circle',
    iconBg: 'bg-emerald-500/10 text-emerald-500'
  },
  {
    key: 'pendientes',
    label: 'En Cola de Auditoría',
    value: kpis.value.pendientes,
    subtext: kpis.value.pendientes > 0 ? 'Requieren revisión' : 'Bandeja al día',
    icon: 'fas fa-clock',
    iconBg: 'bg-orange-500/10 text-orange-500'
  },
  {
    key: 'tokensActivos',
    label: 'Enlaces en Circulación',
    value: kpis.value.tokensActivos,
    subtext: 'Disponibles para clientes',
    icon: 'fas fa-link',
    iconBg: 'bg-sky-500/10 text-sky-500'
  },
  {
    key: 'tokensTotal',
    label: 'Emisión de Enlaces',
    value: kpis.value.tokensTotal,
    subtext: `${kpis.value.tokensUsados} canjeados con éxito`,
    icon: 'fas fa-hashtag',
    iconBg: 'bg-violet-500/10 text-violet-500'
  },
  {
    key: 'usuariosActivos',
    label: 'Operadores Activos',
    value: kpis.value.usuariosActivos,
    subtext: 'Con acceso autorizado',
    icon: 'fas fa-users',
    iconBg: 'bg-indigo-500/10 text-indigo-500'
  }
])

async function load(forceRefresh = false) {
  // 1. Cache Hit (render inmediato de métricas)
  if (!forceRefresh) {
    const cached = cacheStorage.get('dashboard_kpis', 120000)
    if (cached?.data) {
      kpis.value = cached.data.kpis
      lastUpdated.value = cached.data.lastUpdated
      isLoading.value = false
      if (!cached.isExpired) return
    }
  }

  // 2. Cache Miss o sincronización en background
  try {
    const [resenasRes, tokensRes, usersRes] = await Promise.all([
      supabase.from('resenas').select('calificacion, estado'),
      supabase.from('tokens').select('estado'),
      supabase.from('whitelist').select('estado').eq('estado', 'Activo')
    ])

    const resList = resenasRes.data || []
    const tokList = tokensRes.data || []
    const usrList = usersRes.data || []

    const totalResenas = resList.length
    const pendientes = resList.filter(r => r.estado === 'Pendiente').length
    const aprobadas = resList.filter(r => r.estado === 'Aprobado').length
    const sumaCalif = resList.reduce((acc, r) => acc + (parseFloat(r.calificacion) || 0), 0)
    const promedio = totalResenas ? Math.round((sumaCalif / totalResenas) * 10) / 10 : 0

    const tokensTotal = tokList.length
    const tokensActivos = tokList.filter(t => t.estado === 'Activo').length
    const tokensUsados = tokList.filter(t => t.estado === 'Usado').length
    const usuariosActivos = usrList.length

    const computedKpis = {
      totalResenas,
      pendientes,
      aprobadas,
      promedio,
      tokensActivos,
      tokensUsados,
      tokensTotal,
      usuariosActivos
    }

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    kpis.value = computedKpis
    lastUpdated.value = timeString

    cacheStorage.set('dashboard_kpis', { kpis: computedKpis, lastUpdated: timeString })
  } catch (e) {
    console.error('Error calculando indicadores:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => load(false))
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-y-auto lg:overflow-hidden pb-6 lg:pb-2 select-none">
    <div class="shrink-0 flex items-center justify-between gap-4 pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <span class="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {{ config?.nombre || 'Centro de Control' }}
        </span>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Indicadores de Rendimiento
        </h2>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <span v-if="lastUpdated" class="text-xs text-slate-400 hidden sm:inline-block tabular-nums">
          Sincronizado: {{ lastUpdated }}
        </span>
        <button
          @click="load(true)"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
        >
          <i :class="['fas fa-sync-alt text-slate-400 text-xs', { 'animate-spin text-amber-500': isLoading }]"></i>
          <span class="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex-1 min-h-0">
      <SkeletonBlock variant="bento" />
    </div>

    <div v-else class="flex flex-col lg:flex-1 lg:min-h-0 lg:grid lg:grid-rows-12 gap-4">
      <div class="lg:row-span-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:min-h-0">
        <div class="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Calificación Media Global
            </span>
            <div class="mt-3 flex items-baseline gap-3">
              <span class="text-6xl font-extrabold text-slate-900 dark:text-white leading-none">
                {{ (kpis.promedio || 0).toFixed(1) }}
              </span>
              <span class="text-sm font-semibold text-slate-400">/ 5.0 pts</span>
            </div>
          </div>
          <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center text-xs">
            <span>Publicadas: <strong class="text-slate-800 dark:text-white">{{ kpis.aprobadas }}</strong> | Pendientes: <strong class="text-slate-800 dark:text-white">{{ kpis.pendientes }}</strong></span>
            <span class="font-bold text-emerald-500">{{ approvalRate }}% Aprobación</span>
          </div>
        </div>

        <div class="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Conversión de Invitaciones</span>
            <div class="mt-3 flex items-baseline gap-2.5">
              <span class="text-6xl font-extrabold text-slate-900 dark:text-white leading-none">
                {{ conversionRate }}%
              </span>
              <span class="text-sm text-slate-400">efectividad</span>
            </div>
          </div>
          <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-400">
            Canjeados: <strong class="text-slate-800 dark:text-white">{{ kpis.tokensUsados }}</strong> de <strong class="text-slate-800 dark:text-white">{{ kpis.tokensTotal }}</strong> emitidos
          </div>
        </div>
      </div>

      <div class="lg:row-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:min-h-0">
        <div
          v-for="c in secondaryCards"
          :key="c.key"
          class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-5 flex flex-col justify-between shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">{{ c.label }}</span>
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center', c.iconBg]">
              <i :class="[c.icon, 'text-sm']"></i>
            </div>
          </div>
          <p class="text-3xl font-extrabold text-slate-900 dark:text-white my-auto">{{ c.value }}</p>
          <span class="text-xs text-slate-400">{{ c.subtext }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
