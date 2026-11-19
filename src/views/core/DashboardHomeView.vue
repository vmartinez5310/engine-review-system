<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { cacheStorage } from '../../utils/cache'

defineProps({ config: { type: Object, default: () => ({}) } })

const isLoading = ref(true)
const isRefreshing = ref(false)
const pullStartY = ref(0)
const pullDistance = ref(0)

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

async function load(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheStorage.get('dashboard_kpis', 120000)
    if (cached?.data) {
      kpis.value = cached.data.kpis
      isLoading.value = false
      if (!cached.isExpired) return
    }
  }

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

    kpis.value = computedKpis
    cacheStorage.set('dashboard_kpis', { kpis: computedKpis })
  } catch (e) {
    console.error('Error calculando indicadores:', e)
  } finally {
    isLoading.value = false
    isRefreshing.value = false
    pullDistance.value = 0
  }
}

// Lógica de Pull to Refresh en móvil
function onTouchStart(e) {
  if (window.scrollY === 0) {
    pullStartY.value = e.touches[0].clientY
  }
}

function onTouchMove(e) {
  if (pullStartY.value > 0) {
    const currentY = e.touches[0].clientY
    const diff = currentY - pullStartY.value
    if (diff > 0) {
      pullDistance.value = Math.min(diff * 0.4, 70)
    }
  }
}

async function onTouchEnd() {
  if (pullDistance.value >= 50) {
    isRefreshing.value = true
    await load(true)
  }
  pullStartY.value = 0
  pullDistance.value = 0
}

onMounted(() => load(false))
</script>

<template>
  <div
    class="w-full flex flex-col gap-6 select-none relative"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- Indicador de Pull to Refresh -->
    <div
      v-if="pullDistance > 0 || isRefreshing"
      class="flex items-center justify-center transition-all duration-150 py-2"
      :style="{ height: `${pullDistance}px` }"
    >
      <svg :class="['w-5 h-5 text-brand', { 'animate-spin': isRefreshing }]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
    </div>

    <!-- Título de sección limpio sin marcas de tiempo ni botón manual -->
    <div class="border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
      <h3 class="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">Indicadores Operativos</h3>
    </div>

    <!-- Retícula de Datos -->
    <div class="grid grid-cols-1 lg:grid-cols-12 border border-slate-200/70 dark:border-slate-800/60 bg-white/40 dark:bg-[#0F172A]/20 backdrop-blur-md rounded-lg overflow-hidden">
      <!-- Métrica Calificación -->
      <div class="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/60 dark:border-slate-800/60">
        <span class="text-xs text-slate-400 font-medium">Calificación global</span>
        <div class="my-4 flex items-baseline gap-2">
          <span class="text-5xl sm:text-6xl font-light text-slate-900 dark:text-slate-100 tabular-nums">
            {{ (kpis.promedio || 0).toFixed(1) }}
          </span>
          <span class="text-xs text-slate-400">/ 5.0 pts</span>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800/40">
          <span>Publicadas: <strong class="text-slate-800 dark:text-slate-200 font-medium">{{ kpis.aprobadas }}</strong></span>
          <span>•</span>
          <span>Pendientes: <strong class="text-slate-800 dark:text-slate-200 font-medium">{{ kpis.pendientes }}</strong></span>
          <span>•</span>
          <span class="text-emerald-500 font-medium">{{ approvalRate }}% aprobación</span>
        </div>
      </div>

      <!-- Métrica Conversión -->
      <div class="lg:col-span-5 p-5 sm:p-7 flex flex-col justify-between">
        <span class="text-xs text-slate-400 font-medium">Conversión de invitaciones</span>
        <div class="my-4 flex items-baseline gap-2">
          <span class="text-5xl sm:text-6xl font-light text-slate-900 dark:text-slate-100 tabular-nums">
            {{ conversionRate }}%
          </span>
          <span class="text-xs text-slate-400">efectividad</span>
        </div>
        <div class="text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800/40">
          <span>{{ kpis.tokensUsados }} canjeadas de {{ kpis.tokensTotal }} emitidas</span>
        </div>
      </div>
    </div>

    <!-- Métricas Secundarias -->
    <div class="grid grid-cols-2 lg:grid-cols-4 border border-slate-200/70 dark:border-slate-800/60 bg-white/40 dark:bg-[#0F172A]/20 backdrop-blur-md rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60 dark:divide-slate-800/60">
      <div class="p-4 sm:p-5 flex flex-col justify-between">
        <span class="text-xs text-slate-400 font-medium">Total reseñas</span>
        <span class="text-2xl sm:text-3xl font-light text-slate-900 dark:text-slate-100 my-2 tabular-nums">{{ kpis.totalResenas }}</span>
        <span class="text-xs text-slate-400">Acumulado</span>
      </div>

      <div class="p-4 sm:p-5 flex flex-col justify-between">
        <span class="text-xs text-slate-400 font-medium">Por auditar</span>
        <span class="text-2xl sm:text-3xl font-light text-slate-900 dark:text-slate-100 my-2 tabular-nums">{{ kpis.pendientes }}</span>
        <span class="text-xs text-slate-400">{{ kpis.pendientes > 0 ? 'Requieren revisión' : 'Al día' }}</span>
      </div>

      <div class="p-4 sm:p-5 flex flex-col justify-between">
        <span class="text-xs text-slate-400 font-medium">Enlaces activos</span>
        <span class="text-2xl sm:text-3xl font-light text-slate-900 dark:text-slate-100 my-2 tabular-nums">{{ kpis.tokensActivos }}</span>
        <span class="text-xs text-slate-400">En circulación</span>
      </div>

      <div class="p-4 sm:p-5 flex flex-col justify-between">
        <span class="text-xs text-slate-400 font-medium">Operadores</span>
        <span class="text-2xl sm:text-3xl font-light text-slate-900 dark:text-slate-100 my-2 tabular-nums">{{ kpis.usuariosActivos }}</span>
        <span class="text-xs text-slate-400">Activos</span>
      </div>
    </div>
  </div>
</template>
