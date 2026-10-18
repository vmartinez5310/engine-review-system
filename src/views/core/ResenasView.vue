<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import GenerarResenaModal from './GenerarResenaModal.vue'

const activeSubTab = ref('recibidas')
const isLoading = ref(true)
const reviews = ref([])
const tracks = ref([])

const showManageModal = ref(false)
const selectedReview = ref(null)
const replyText = ref('')
const isAILoading = ref(false)

const showGenerateModal = ref(false)

const reviewColumns = computed(() => {
  const baseCols = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'cliente', label: 'Cliente', required: true },
    { key: 'servicio', label: 'Servicio/Zona', hidden: true },
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

const trackColumns = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'cliente', label: 'Cliente', required: true },
  { key: 'servicio', label: 'Servicio' },
  { key: 'dias', label: 'Días' },
  { key: 'estado', label: 'Estado', required: true }
]

const trackFilterOptions = ['Activo', 'Usado', 'Expirado', 'Revocado']

async function fetchReviews() {
  isLoading.value = true
  try {
    reviews.value = await apiClient.post('get_dashboard_reviews')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

async function fetchTracks() {
  isLoading.value = true
  try {
    tracks.value = await apiClient.post('get_tracking')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchReviews)

watch(activeSubTab, (tab) => {
  if (tab === 'recibidas') fetchReviews()
  if (tab === 'por_evaluar') fetchTracks()
})

function openManageModal(review) {
  selectedReview.value = review
  replyText.value = review.respuesta || ''
  showManageModal.value = true
}

async function saveApproval() {
  const result = await window.Swal?.fire({
    title: '¿Publicar respuesta?',
    text: 'Será visible en internet',
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

function onGenerateSuccess() {
  if (activeSubTab.value === 'por_evaluar') fetchTracks()
}

function sendWhatsAppReminder(item) {
  if (!item.url) return
  const text = encodeURIComponent(
    `Hola ${item.cliente}. ¿Qué te pareció nuestro servicio? Ayúdanos con tu opinión aquí: ${item.url}`
  )
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
}

function handleRowClick(row) {
  if (activeSubTab.value === 'recibidas') {
    if (hasPermission('editar_resena')) openManageModal(row)
  } else if (activeSubTab.value === 'por_evaluar' && row.estado === 'Activo') {
    sendWhatsAppReminder(row)
  }
}

async function revokeTrack(item) {
  if (!hasPermission('editar_resena')) return
  const result = await window.Swal?.fire({
    title: '¿Revocar enlace?',
    text: item.cliente,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444'
  })
  if (!result?.isConfirmed) return
  try {
    await apiClient.post('revoke_link', { fila: item.fila })
    item.estado = 'Revocado'
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

    <div class="flex-1 overflow-hidden flex flex-col relative">
      <Transition name="fade" mode="out-in">
        <div v-if="activeSubTab === 'recibidas'" class="absolute inset-0 flex flex-col">
          <SkeletonBlock v-if="isLoading" variant="table" :rows="8" />
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
                @click="showGenerateModal = true"
              >
                <span class="hidden sm:inline ml-1">Pedir Reseña</span>
              </BaseButton>
            </template>

            <template #cell-calificacion="{ item }">
              <BaseStarRating :score="Number(item.calificacion)" />
            </template>

            <template #cell-comentario="{ item }">
              <span class="truncate block max-w-xs">{{ item.comentario }}</span>
            </template>

            <template #cell-legalOk="{ item }">
              <i
                v-if="item.legalOk"
                class="fas fa-check-circle text-emerald-500"
                title="Aceptó términos"
              />
              <i v-else class="fas fa-minus text-slate-300 dark:text-slate-600" />
            </template>

            <template #cell-respuesta="{ item }">
              <span v-if="item.respuesta" class="truncate block max-w-xs">{{ item.respuesta }}</span>
              <span v-else class="text-slate-400 italic text-xs">Sin respuesta</span>
            </template>

            <template #cell-estado="{ item }">
              <StatusBadge :status="item.estado" />
            </template>
          </DataTable>
        </div>

        <div v-else-if="activeSubTab === 'por_evaluar'" class="absolute inset-0 flex flex-col">
          <SkeletonBlock v-if="isLoading" variant="table" :rows="8" />
          <DataTable
            v-else
            :mobile-preview-count="3"
            :columns="trackColumns"
            :data="tracks"
            :is-loading="false"
            search-placeholder="Buscar cliente..."
            :filter-options="trackFilterOptions"
            filter-column-key="estado"
            @row-click="handleRowClick"
          >
            <template #header-actions>
              <BaseButton
                v-if="hasPermission('generar_enlace')"
                icon="fas fa-plus"
                @click="showGenerateModal = true"
              >
                <span class="hidden sm:inline ml-1">Pedir Reseña</span>
              </BaseButton>
            </template>

            <template #cell-dias="{ item }">
              <span
                class="text-sm font-medium tabular-nums"
                :class="
                  item.estado === 'Expirado' || item.dias >= 7
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400'
                "
              >
                {{ item.dias }} días
              </span>
            </template>

            <template #cell-estado="{ item }">
              <StatusBadge :status="item.estado" />
            </template>

            <template #actions="{ item }">
              <button
                v-if="item.estado === 'Activo' && hasPermission('editar_resena')"
                type="button"
                class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Revocar"
                @click.stop="revokeTrack(item)"
              >
                <i class="fas fa-ban text-xs" />
              </button>
            </template>
          </DataTable>
        </div>
      </Transition>
    </div>

    <!-- Manage-review modal (extract to GestionResenaModal in a later authorized step) -->
    <BaseModal v-model="showManageModal" title="Gestión de Reseña" max-width="max-w-xl">
      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
      <p class="text-sm font-semibold text-slate-800 dark:text-white mb-3">
        {{ selectedReview?.cliente }}
      </p>
      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Comentario</label>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">
        {{ selectedReview?.comentario }}
      </p>
      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Respuesta pública</label>
      <textarea
        v-model="replyText"
        rows="4"
        class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
        placeholder="Escribe o genera con IA..."
      />
      <template #footer>
        <BaseButton variant="outline" @click="handleArchive(selectedReview)">Archivar</BaseButton>
        <BaseButton variant="outline" :is-loading="isAILoading" icon="fas fa-magic" @click="callGeminiAI">
          IA
        </BaseButton>
        <BaseButton icon="fas fa-check" @click="saveApproval">Publicar</BaseButton>
      </template>
    </BaseModal>

    <GenerarResenaModal v-model="showGenerateModal" @success="onGenerateSuccess" />
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
