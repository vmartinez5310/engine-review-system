<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import GenerarResenaModal from './GenerarResenaModal.vue'

// --- ESTADOS PRINCIPALES ---
const activeSubTab = ref('recibidas') // 'recibidas' | 'por_evaluar'
const isLoading = ref(true)
const reviews = ref([])
const tokens = ref([])

// --- ESTADOS: MODALES ---
const showManageModal = ref(false)
const selectedReview = ref(null)
const replyText = ref('')
const isAILoading = ref(false)

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

// --- CARGA DE DATOS ---
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

onMounted(fetchData)
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
  replyText.value = review.respuesta || ''
  showManageModal.value = true
}

async function saveApproval() {
  const result = await window.Swal?.fire({
    title: '¿Publicar respuesta?',
    text: 'Será visible públicamente',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981'
  })
  if (!result?.isConfirmed) return

  try {
    await apiClient.post('update_review', {
      fila: selectedReview.value.fila,
      estado: 'Aprobado',
      respuesta: replyText.value
    })
    selectedReview.value.estado = 'Aprobado'
    selectedReview.value.respuesta = replyText.value
    showManageModal.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Publicado',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

async function handleArchive(item) {
  const result = await window.Swal?.fire({
    title: '¿Archivar esta reseña?',
    text: 'Se ocultará públicamente',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444'
  })
  if (!result?.isConfirmed) return

  try {
    await apiClient.post('update_review', { fila: item.fila, estado: 'Archivado' })
    item.estado = 'Archivado'
    showManageModal.value = false
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

async function callGeminiAI() {
  if (!replyText.value) replyText.value = 'Agradece cordialmente la reseña.'
  isAILoading.value = true
  try {
    const res = await apiClient.post('call_ai', {
      prompt: `Actúa como RP. Cliente dijo: "${selectedReview.value.comentario}". Borrador: "${replyText.value}". Mejora y devuelve SOLO respuesta.`
    })
    replyText.value = res.texto
  } catch (e) {
    window.Swal?.fire('Error de IA', e.message, 'error')
  } finally {
    isAILoading.value = false
  }
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
    <BaseModal v-model="showManageModal" title="Gestión de Reseña" max-width="max-w-xl">
      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
      <p class="text-sm font-semibold text-slate-800 dark:text-white mb-3">{{ selectedReview?.cliente }}</p>
      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Comentario</label>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">{{ selectedReview?.comentario }}</p>
      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Respuesta pública</label>
      <textarea
        v-model="replyText"
        rows="4"
        class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
        placeholder="Escribe o genera con IA..."
      />
      <template #footer>
        <BaseButton variant="outline" @click="handleArchive(selectedReview)">Archivar</BaseButton>
        <BaseButton variant="outline" :is-loading="isAILoading" icon="fas fa-magic" @click="callGeminiAI">IA</BaseButton>
        <BaseButton icon="fas fa-check" @click="saveApproval">Publicar</BaseButton>
      </template>
    </BaseModal>

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