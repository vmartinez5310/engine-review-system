<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { cacheStorage } from '../../utils/cache'

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

async function load(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheStorage.get('dashboard_kpis', 120000)
    if (cached?.data) {
      kpis.value = cached.data.kpis
      lastUpdated.value = cached.data.lastUpdated
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
  <div class="w-full flex flex-col gap-8 select-none">
    <!-- Header de sección sutil -->
    <div class="flex items-baseline justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
      <div>
        <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100">Indicadores Operativos</h3>
      </div>
      <div class="flex items-center gap-3 text-xs text-slate-400">
        <span v-if="lastUpdated" class="font-mono tabular-nums">Sincronizado {{ lastUpdated }}</span>
        <button
          @click="load(true)"
          :disabled="isLoading"
          class="text-slate-600 dark:text-slate-300 hover:text-brand transition-colors cursor-pointer"
        >
          Actualizar
        </button>
      </div>
    </div>

    <!-- Retícula Arquitectónica Proporción Áurea (62% / 38%) sin cards -->
    <div class="grid grid-cols-1 lg:grid-cols-12 border border-slate-200/70 dark:border-slate-800/60 bg-white/40 dark:bg-[#0F172A]/20 backdrop-blur-md rounded-lg overflow-hidden">
      <!-- Métrica Principal: Calificación -->
      <div class="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/60 dark:border-slate-800/60">
        <span class="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400">Calificación Global</span>
        <div class="my-6 flex items-baseline gap-3">
          <span class="text-6xl sm:text-7xl font-light tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {{ (kpis.promedio || 0).toFixed(1) }}
          </span>
          <span class="text-sm font-normal text-slate-400">/ 5.0 pts</span>
        </div>
        <div class="flex items-center gap-4 text-xs text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/40">
          <span>Publicadas: <strong class="text-slate-800 dark:text-slate-200 font-semibold">{{ kpis.aprobadas }}</strong></span>
          <span>•</span>
          <span>Pendientes: <strong class="text-slate-800 dark:text-slate-200 font-semibold">{{ kpis.pendientes }}</strong></span>
          <span>•</span>
          <span class="text-emerald-500 font-medium">{{ approvalRate }}% tasa de aprobación</span>
        </div>
      </div>

      <!-- Métrica Secundaria: Conversión de Enlaces -->
      <div class="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
        <span class="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400">Conversión de Invitaciones</span>
        <div class="my-6 flex items-baseline gap-2">
          <span class="text-6xl sm:text-7xl font-light tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {{ conversionRate }}%
          </span>
          <span class="text-sm font-normal text-slate-400">efectividad</span>
        </div>
        <div class="text-xs text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/40">
          <span>{{ kpis.tokensUsados }} canjeadas de {{ kpis.tokensTotal }} emitidas</span>
        </div>
      </div>
    </div>

    <!-- Rejilla de métricas secundarias en retícula editorial continua -->
    <div class="grid grid-cols-2 lg:grid-cols-4 border border-slate-200/70 dark:border-slate-800/60 bg-white/40 dark:bg-[#0F172A]/20 backdrop-blur-md rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60 dark:divide-slate-800/60">
      <div class="p-5 sm:p-6 flex flex-col justify-between">
        <span class="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400">Total Reseñas</span>
        <span class="text-3xl font-light text-slate-900 dark:text-slate-100 my-3 tabular-nums">{{ kpis.totalResenas }}</span>
        <span class="text-xs text-slate-400">Histórico acumulado</span>
      </div>

      <div class="p-5 sm:p-6 flex flex-col justify-between">
        <span class="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400">Por Auditar</span>
        <span class="text-3xl font-light text-slate-900 dark:text-slate-100 my-3 tabular-nums">{{ kpis.pendientes }}</span>
        <span class="text-xs text-slate-400">{{ kpis.pendientes > 0 ? 'Requieren moderación' : 'Bandeja al día' }}</span>
      </div>

      <div class="p-5 sm:p-6 flex flex-col justify-between">
        <span class="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400">Enlaces Activos</span>
        <span class="text-3xl font-light text-slate-900 dark:text-slate-100 my-3 tabular-nums">{{ kpis.tokensActivos }}</span>
        <span class="text-xs text-slate-400">En circulación</span>
      </div>

      <div class="p-5 sm:p-6 flex flex-col justify-between">
        <span class="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400">Operadores</span>
        <span class="text-3xl font-light text-slate-900 dark:text-slate-100 my-3 tabular-nums">{{ kpis.usuariosActivos }}</span>
        <span class="text-xs text-slate-400">Cuentas activas</span>
      </div>
    </div>
  </div>
</template>
