<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import GenerarResenaModal from './GenerarResenaModal.vue'
import GestionResenaModal from './GestionResenaModal.vue'

const props = defineProps({
  initialSubTab: {
    type: String,
    default: null
  }
})

// --- ESTADOS PRINCIPALES ---
const activeSubTab = ref('recibidas') // 'recibidas' | 'por_evaluar'
const isLoading = ref(true)
const reviews = ref([])
const tokens = ref([])

// --- ESTADOS: MODALES ---
const showManageModal = ref(false)
const selectedReview = ref(null)

const showGenerateModal = ref(false)
const selectedToken = ref(null)

// --- CONFIGURACIÓN DE COLUMNAS ---
const reviewColumns = computed(() => {
  const baseCols = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'cliente', label: 'Cliente', required: true },
    { key: 'servicio', label: 'Servicio', hidden: true },
    { key: 'legalOk', label: 'LEGAL', hidden: true },
    { key: 'calificacion', label: 'Calif.', required: true },
    { key: 'comentario', label: 'Reseña' },
    { key: 'estado', label: 'Estado', required: true }
  ]
  if (hasPermission('editar_resena')) {
    baseCols.push({ key: 'respuesta', label: 'Respuesta', hidden: true })
  }
  return baseCols
})

const tokenColumns = [
  { key: 'id', label: 'ID', hidden: true },
  { key: 'fecha', label: 'Generado' },
  { key: 'cliente', label: 'Cliente', required: true },
  { key: 'servicio', label: 'Servicio' },
  { key: 'dias', label: 'Transcurrido' },
  { key: 'asesor', label: 'Asesor', hidden: true },
  { key: 'estado', label: 'Estado', required: true }
]

const tokenFilterOptions = ['Activo', 'Usado', 'Expirado', 'Revocado']

// --- CARGA DE DATOS (Modificado para capturar subpestañas sin router) ---
async function fetchData() {
  isLoading.value = true
  try {
    if (activeSubTab.value === 'recibidas') {
      reviews.value = await apiClient.post('get_dashboard_reviews')
    } else if (activeSubTab.value === 'por_evaluar') {
      tokens.value = await apiClient.post('get_tokens')
    }
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Prioritize prop from parent navigation, then URL param as fallback
  let targetSub = props.initialSubTab
  if (!targetSub) {
    const params = new URLSearchParams(window.location.search)
    targetSub = params.get('subtab')
    if (targetSub) {
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl)
    }
  }

  if (targetSub === 'recibidas' || targetSub === 'por_evaluar') {
    if (activeSubTab.value !== targetSub) {
      activeSubTab.value = targetSub
      return // watch will fetch
    }
  }
  fetchData()
})

watch(() => props.initialSubTab, (newSub) => {
  if (newSub === 'recibidas' || newSub === 'por_evaluar') {
    activeSubTab.value = newSub
  }
})

// Mantenemos el watcher para los cambios manuales que haga el usuario haciendo clic en los botones superiores
watch(activeSubTab, fetchData)
// --- APERTURA UNIFICADA DE MODALES ---
function openNewLinkModal() {
  selectedToken.value = null
  showGenerateModal.value = true
}

function handleRowClick(row) {
  if (activeSubTab.value === 'recibidas') {
    if (hasPermission('editar_resena')) openManageModal(row)
  } else if (activeSubTab.value === 'por_evaluar') {
    selectedToken.value = row
    showGenerateModal.value = true
  }
}

// --- GESTIÓN DE RESEÑAS RECIBIDAS ---
function openManageModal(review) {
  selectedReview.value = review
  showManageModal.value = true
}

// --- GESTIÓN DE TOKENS ---
function onGenerateSuccess() {
  if (activeSubTab.value === 'por_evaluar') fetchData()
}

async function revokeToken(item) {
  if (!hasPermission('editar_resena') || !item) return
  const result = await window.Swal?.fire({
    title: '¿Revocar enlace?',
    text: `Se inhabilitará el enlace de ${item.cliente}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444'
  })
  if (!result?.isConfirmed) return

  try {
    await apiClient.post('revoke_link', { fila: item.fila })
    item.estado = 'Revocado'
    showGenerateModal.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Enlace revocado',
      toast: true,
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <!-- SELECTOR DE SUB-PESTAÑAS -->
    <div class="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-full sm:w-fit shrink-0">
      <button
        type="button"
        :class="[
          'flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm',
          activeSubTab === 'recibidas'
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-none'
        ]"
        @click="activeSubTab = 'recibidas'"
      >
        Bandeja de Entrada
      </button>
      <button
        v-if="hasPermission('ver_seguimientos')"
        type="button"
        :class="[
          'flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm',
          activeSubTab === 'por_evaluar'
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-none'
        ]"
        @click="activeSubTab = 'por_evaluar'"
      >
        Por Evaluar
      </button>
    </div>

    <!-- ÁREA DE TABLAS -->
    <div class="flex-1 overflow-hidden flex flex-col relative">
      <Transition name="fade" mode="out-in">
        <!-- PESTAÑA 1: RESEÑAS RECIBIDAS -->
        <div v-if="activeSubTab === 'recibidas'" key="recibidas" class="absolute inset-0 flex flex-col">
          <SkeletonBlock v-if="isLoading" variant="table" :rows="6" />
          <DataTable
            v-else
            :mobile-preview-count="3"
            :columns="reviewColumns"
            :data="reviews"
            :is-loading="false"
            search-placeholder="Buscar en reseñas..."
            :filter-options="['Pendiente', 'Aprobado', 'Archivado']"
            filter-column-key="estado"
            @row-click="handleRowClick"
          >
            <template #header-actions>
              <BaseButton
                v-if="hasPermission('generar_enlace')"
                icon="fas fa-plus"
                @click="openNewLinkModal"
              >
                <span class="hidden sm:inline ml-1">Pedir Reseña</span>
              </BaseButton>
            </template>
            <template #cell-calificacion="{ item }">
              <BaseStarRating :score="Number(item.calificacion)" />
            </template>
            <template #cell-comentario="{ item }">
              <div class="max-w-[140px] 2xl:max-w-[240px] truncate text-slate-700 dark:text-slate-300">
                {{ item.comentario }}
              </div>
            </template>
            <template #cell-legalOk="{ item }">
              <div class="text-center">
                <i v-if="item.legalOk" class="fas fa-check-circle text-emerald-500"></i>
                <i v-else class="fas fa-minus text-slate-300"></i>
              </div>
            </template>
            <template #cell-respuesta="{ item }">
              <div
                v-if="item.respuesta"
                class="max-w-[140px] 2xl:max-w-[240px] truncate text-slate-700 dark:text-slate-300"
              >
                {{ item.respuesta }}
              </div>
              <span v-else class="text-slate-400 italic text-[11px]">Sin respuesta</span>
            </template>
            <template #cell-estado="{ item }">
              <StatusBadge :status="item.estado" />
            </template>
          </DataTable>
        </div>

        <!-- PESTAÑA 2: POR EVALUAR (TOKENS GENERADOS) -->
        <div v-else-if="activeSubTab === 'por_evaluar'" key="por_evaluar" class="absolute inset-0 flex flex-col">
          <SkeletonBlock v-if="isLoading" variant="tokens" :rows="6" />
          <DataTable
            v-else
            :mobile-preview-count="3"
            :columns="tokenColumns"
            :data="tokens"
            :is-loading="false"
            search-placeholder="Buscar cliente o servicio..."
            :filter-options="tokenFilterOptions"
            filter-column-key="estado"
            @row-click="handleRowClick"
          >
            <template #header-actions>
              <BaseButton
                v-if="hasPermission('generar_enlace')"
                icon="fas fa-plus"
                @click="openNewLinkModal"
              >
                <span class="hidden sm:inline ml-1">Pedir Reseña</span>
              </BaseButton>
            </template>

            <template #cell-dias="{ item }">
              <span
                class="text-xs font-semibold tabular-nums"
                :class="
                  item.estado === 'Expirado' || item.dias >= 7
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400'
                "
              >
                {{ item.dias === 0 ? 'Hoy' : `${item.dias} días` }}
              </span>
            </template>

            <template #cell-estado="{ item }">
              <StatusBadge :status="item.estado" />
            </template>

            <template #actions="{ item }">
              <button
                v-if="item.estado === 'Activo' && hasPermission('editar_resena')"
                type="button"
                class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Revocar enlace"
                @click.stop="revokeToken(item)"
              >
                <i class="fas fa-ban text-xs" />
              </button>
            </template>
          </DataTable>
        </div>
      </Transition>
    </div>

    <!-- MODAL DE GESTIÓN DE RESEÑA RECIBIDA -->
    <GestionResenaModal v-model="showManageModal" :review="selectedReview" @updated="fetchData" />

    <!-- MODAL UNIFICADO DE ENLACES (CREACIÓN Y VISTA DE TICKET QR) -->
    <GenerarResenaModal
      v-model="showGenerateModal"
      :initial-token="selectedToken"
      @success="onGenerateSuccess"
      @revoke="revokeToken"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>