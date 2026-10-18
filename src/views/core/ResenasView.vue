<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'

const activeSubTab = ref('recibidas')
const isLoading = ref(true)
const reviews = ref([])
const tracks = ref([])

const showManageModal = ref(false)
const selectedReview = ref(null)
const replyText = ref('')
const isAILoading = ref(false)

const showRequestModal = ref(false)
const isGenerating = ref(false)
const requestForm = ref({ cliente: '', servicio: '' })
const generatedResult = ref(null)

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

async function generateReviewLink() {
  if (!requestForm.value.cliente || !requestForm.value.servicio) {
    return window.Swal?.fire('Atención', 'Ingresa cliente y servicio', 'warning')
  }
  isGenerating.value = true
  try {
    const res = await apiClient.post('generate_link', {
      nombre: requestForm.value.cliente,
      servicio: requestForm.value.servicio
    })
    const link = res.url
    generatedResult.value = {
      link,
      cliente: requestForm.value.cliente,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link)}`
    }
    if (activeSubTab.value === 'por_evaluar') await fetchTracks()
  } catch (e) {
    window.Swal?.fire('Error', e.message || 'No se pudo generar el enlace.', 'error')
  } finally {
    isGenerating.value = false
  }
}

function sendWhatsAppReminder(item) {
  if (!item.url) return
  const text = encodeURIComponent(
    `Hola ${item.cliente}. ¿Qué te pareció nuestro servicio? Ayúdanos con tu opinión aquí: ${item.url}`
  )
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
  window.Swal?.fire({
    icon: 'success',
    title: 'Copiado',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1500
  })
}

function closeRequestModal() {
  showRequestModal.value = false
  requestForm.value = { cliente: '', servicio: '' }
  generatedResult.value = null
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
        @click="activeSubTab = 'recibidas'"
        :class="[
          'flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm',
          activeSubTab === 'recibidas'
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-none'
        ]"
      >
        Bandeja de Entrada
      </button>
      <button
        v-if="hasPermission('ver_seguimientos')"
        @click="activeSubTab = 'por_evaluar'"
        :class="[
          'flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm',
          activeSubTab === 'por_evaluar'
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-none'
        ]"
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
            @row-click="handleRowClick"
            :mobile-preview-count="3"
            :columns="reviewColumns"
            :data="reviews"
            :is-loading="false"
            search-placeholder="Buscar en reseñas..."
            :filter-options="['Pendiente', 'Aprobado', 'Archivado']"
            filter-column-key="estado"
          >
            <template #header-actions>
              <BaseButton
                v-if="hasPermission('generar_enlace')"
                icon="fas fa-plus"
                @click="showRequestModal = true"
                class="px-4 py-2.5 sm:px-5"
              >
                <span class="hidden sm:inline ml-1">Pedir Reseña</span>
              </BaseButton>
            </template>

            <template #cell-calificacion="{ item }">
              <BaseStarRating :score="Number(item.calificacion)" />
            </template>

            <template #cell-comentario="{ item }">
              <div class="max-w-[120px] 2xl:max-w-[200px] truncate text-slate-700 dark:text-slate-300">
                {{ item.comentario }}
              </div>
            </template>

            <template #cell-legalOk="{ item }">
              <div class="text-center">
                <i v-if="item.legalOk" class="fas fa-check-circle text-emerald-500" title="Aceptó términos" />
                <i v-else class="fas fa-minus text-slate-300 dark:text-slate-600" />
              </div>
            </template>

            <template #cell-respuesta="{ item }">
              <div
                v-if="item.respuesta"
                class="max-w-[120px] 2xl:max-w-[200px] truncate text-slate-700 dark:text-slate-300"
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

        <div v-else-if="activeSubTab === 'por_evaluar'" class="absolute inset-0 flex flex-col">
          <SkeletonBlock v-if="isLoading" variant="table" :rows="8" />
          <DataTable
            v-else
            @row-click="handleRowClick"
            :columns="trackColumns"
            :data="tracks"
            :is-loading="false"
            search-placeholder="Buscar cliente..."
            :filter-options="trackFilterOptions"
            filter-column-key="estado"
          >
            <template #header-actions>
              <BaseButton
                v-if="hasPermission('generar_enlace')"
                icon="fas fa-plus"
                @click="showRequestModal = true"
              >
                <span class="hidden sm:inline ml-1">Pedir Reseña</span>
              </BaseButton>
            </template>

            <template #cell-dias="{ item }">
              <span
                :class="[
                  'px-2 py-1 rounded-md text-sm font-medium',
                  item.estado === 'Expirado' || item.dias >= 7
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'text-slate-600 dark:text-slate-400'
                ]"
              >
                {{ item.dias }} días
              </span>
            </template>

            <template #cell-estado="{ item }">
              <div class="flex items-center gap-2">
                <StatusBadge :status="item.estado" />
                <button
                  v-if="item.estado === 'Activo' && hasPermission('editar_resena')"
                  type="button"
                  class="text-xs text-slate-400 hover:text-red-500"
                  title="Revocar"
                  @click.stop="revokeTrack(item)"
                >
                  <i class="fas fa-ban" />
                </button>
              </div>
            </template>
          </DataTable>
        </div>
      </Transition>
    </div>

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

    <BaseModal v-model="showRequestModal" title="Pedir reseña" max-width="max-w-md">
      <div v-if="!generatedResult" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold mb-1 dark:text-slate-300">Nombre del cliente</label>
          <input
            v-model="requestForm.cliente"
            type="text"
            class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
            placeholder="Ej. Juan Pérez"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1 dark:text-slate-300">Servicio realizado</label>
          <input
            v-model="requestForm.servicio"
            type="text"
            class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
            placeholder="Ej. Venta de Casa en Centro"
          />
        </div>
      </div>

      <div v-else class="space-y-5 text-center">
        <div
          class="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium border border-emerald-200 dark:border-emerald-800"
        >
          <i class="fas fa-check-circle mr-1" />
          Enlace único listo para {{ generatedResult.cliente }}
        </div>
        <div
          class="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <input
            type="text"
            readonly
            :value="generatedResult.link"
            class="bg-transparent flex-1 text-xs font-mono outline-none px-2 text-slate-600 dark:text-slate-400"
          />
          <button
            type="button"
            class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-brand hover:text-white rounded-lg text-xs font-semibold transition-colors"
            @click="copyToClipboard(generatedResult.link)"
          >
            <i class="fas fa-copy" />
          </button>
        </div>
        <img
          :src="generatedResult.qrUrl"
          alt="QR Code"
          class="w-32 h-32 mx-auto border border-slate-200 rounded-xl bg-white p-2 shadow-sm"
        />
      </div>

      <template #footer>
        <template v-if="!generatedResult">
          <BaseButton variant="outline" @click="closeRequestModal">Cancelar</BaseButton>
          <BaseButton :is-loading="isGenerating" @click="generateReviewLink">Crear Enlace</BaseButton>
        </template>
        <template v-else>
          <BaseButton variant="outline" @click="closeRequestModal">Listo</BaseButton>
        </template>
      </template>
    </BaseModal>
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
