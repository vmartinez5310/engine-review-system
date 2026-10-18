<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import SkeletonBlock from '../../components/ui/SkeletonBlock.vue'
import GenerarResenaModal from '../core/GenerarResenaModal.vue'

// --- ESTADOS PRINCIPALES ---
const activeSubTab = ref('recibidas') // Solo 'recibidas' y 'enlaces'
const isLoading = ref(true)
const reviews = ref([])
const tokens = ref([])

// Variables de entorno
const URL_Frontend_App = window.URL_Frontend_App || window.location.origin

// --- ESTADOS: MODALES ---
const showManageModal = ref(false)
const selectedReview = ref(null)
const replyText = ref('')
const isAILoading = ref(false)

const showTokenManageModal = ref(false)
const selectedToken = ref(null)

const modalGenerarRef = ref(null)

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
  if (hasPermission('editar_resena')) baseCols.push({ key: 'respuesta', label: 'Respuesta', hidden: true })
  return baseCols
})

// Máximo 4 visibles por defecto (hidden: true oculta las secundarias)
const tokenColumns = [
  { key: 'fecha', label: 'Generado', hidden: true },
  { key: 'cliente', label: 'Cliente', required: true },
  { key: 'servicio', label: 'Servicio', hidden: true },
  { key: 'dias', label: 'Días Transcurridos' },
  { key: 'asesor', label: 'Asesor', hidden: true },
  { key: 'estado', label: 'Estado', required: true }
]

// --- CARGA DE DATOS ---
async function fetchData() {
  isLoading.value = true
  try {
    if (activeSubTab.value === 'recibidas') reviews.value = await apiClient.post('get_dashboard_reviews')
    if (activeSubTab.value === 'enlaces') tokens.value = await apiClient.post('get_tokens')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)
watch(activeSubTab, fetchData)

// --- GESTIÓN DE RESEÑAS RECIBIDAS ---
function openManageModal(review) {
  selectedReview.value = review
  replyText.value = review.respuesta || ''
  showManageModal.value = true
}

async function saveApproval() {
  const result = await window.Swal?.fire({ title: '¿Publicar respuesta?', text: 'Será visible en internet', icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981' })
  if (!result?.isConfirmed) return
  try {
    await apiClient.post('update_review', { fila: selectedReview.value.fila, estado: 'Aprobado', respuesta: replyText.value })
    selectedReview.value.estado = 'Aprobado'
    selectedReview.value.respuesta = replyText.value
    showManageModal.value = false
    window.Swal?.fire({ icon: 'success', title: 'Publicado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
  } catch (e) { window.Swal?.fire('Error', e.message, 'error') }
}

async function handleArchive(item) {
  const result = await window.Swal?.fire({ title: '¿Archivar esta reseña?', text: 'Se ocultará públicamente', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' })
  if (!result?.isConfirmed) return
  try {
    await apiClient.post('update_review', { fila: item.fila, estado: 'Archivado' })
    item.estado = 'Archivado'
    showManageModal.value = false
  } catch (e) { window.Swal?.fire('Error', e.message, 'error') }
}

async function callGeminiAI() {
  if (!replyText.value) replyText.value = 'Agradece cordialmente la reseña.'
  isAILoading.value = true
  try {
    const res = await apiClient.post('call_ai', { prompt: `Actúa como RP. Cliente dijo: "${selectedReview.value.comentario}". Borrador: "${replyText.value}". Mejora y devuelve SOLO respuesta.` })
    replyText.value = res.texto
  } catch (e) { window.Swal?.fire('Error de IA', e.message, 'error') } 
  finally { isAILoading.value = false }
}

// --- GESTIÓN DE ENLACES (TOKENS) ---
function handleRowClick(row) {
  if (activeSubTab.value === 'recibidas' && hasPermission('editar_resena')) {
    openManageModal(row)
  } else if (activeSubTab.value === 'enlaces') {
    // Armar el link real y QR
    const link = row.url || `${URL_Frontend_App}/review/${row.id}`
    selectedToken.value = {
      ...row,
      link: link,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}&margin=10`
    }
    showTokenManageModal.value = true
  }
}

async function revokeLink() {
  if (!hasPermission('editar_resena')) return
  const result = await window.Swal?.fire({ title: '¿Revocar enlace?', text: `Se inhabilitará el token de ${selectedToken.value.cliente}`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' })
  if (!result?.isConfirmed) return
  try {
    await apiClient.post('revoke_link', { fila: selectedToken.value.fila })
    
    // Actualizar datos locales
    const tokenIndex = tokens.value.findIndex(t => t.fila === selectedToken.value.fila)
    if (tokenIndex !== -1) tokens.value[tokenIndex].estado = 'Revocado'
    selectedToken.value.estado = 'Revocado'

    showTokenManageModal.value = false
    window.Swal?.fire({ icon: 'success', title: 'Enlace revocado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false })
  } catch (e) { window.Swal?.fire('Error', e.message, 'error') }
}

// Funciones de Compartir (API Nativa)
async function shareTokenSystem() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Evalúa nuestro servicio',
        text: `Hola ${selectedToken.value.cliente}, por favor ayúdanos evaluando nuestro servicio:`,
        url: selectedToken.value.link
      })
    } catch (err) { console.log('Compartir cancelado', err) }
  } else {
    copyToClipboard(selectedToken.value.link)
  }
}

function sendTokenWhatsApp() {
  const text = encodeURIComponent(`Hola ${selectedToken.value.cliente}. Gracias por confiar en nosotros para: ${selectedToken.value.servicio || 'el servicio'}. ¿Podrías apoyarnos con una breve calificación aquí? ${selectedToken.value.link}`)
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
  window.Swal?.fire({ icon: 'success', title: 'Enlace copiado', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    
    <!-- PESTAÑAS SIMPLIFICADAS -->
    <div class="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-full sm:w-fit shrink-0 overflow-x-auto custom-scrollbar">
      <button @click="activeSubTab = 'recibidas'" :class="['flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap', activeSubTab === 'recibidas' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300']">Bandeja de Entrada</button>
      <button v-if="hasPermission('ver_seguimientos')" @click="activeSubTab = 'enlaces'" :class="['flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap', activeSubTab === 'enlaces' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300']">Enlaces Generados</button>
    </div>

    <!-- ÁREA DE TABLAS -->
    <div class="flex-1 overflow-hidden flex flex-col relative">
      <Transition name="fade" mode="out-in">
        
        <!-- PESTAÑA: RECIBIDAS -->
        <div v-if="activeSubTab === 'recibidas'" class="absolute inset-0 flex flex-col">
          <SkeletonBlock v-if="isLoading" variant="table" :rows="8" />
          <DataTable v-else @row-click="handleRowClick" :mobile-preview-count="3" :columns="reviewColumns" :data="reviews" search-placeholder="Buscar reseñas..." :filter-options="['Pendiente', 'Aprobado', 'Archivado']" filter-column-key="estado">
            <template #header-actions>
              <BaseButton v-if="hasPermission('generar_enlace')" icon="fas fa-plus" @click="modalGenerarRef.open()">Pedir Reseña</BaseButton>
            </template>
            <template #cell-calificacion="{ item }"><BaseStarRating :score="Number(item.calificacion)" /></template>
            <template #cell-comentario="{ item }"><div class="max-w-[120px] 2xl:max-w-[200px] truncate text-slate-700 dark:text-slate-300">{{ item.comentario }}</div></template>
            <template #cell-legalOk="{ item }"><div class="text-center"><i v-if="item.legalOk" class="fas fa-check-circle text-emerald-500"></i><i v-else class="fas fa-minus text-slate-300"></i></div></template>
            <template #cell-respuesta="{ item }"><div v-if="item.respuesta" class="max-w-[120px] 2xl:max-w-[200px] truncate text-slate-700 dark:text-slate-300">{{ item.respuesta }}</div><span v-else class="text-slate-400 italic text-[11px]">Sin respuesta</span></template>
            <template #cell-estado="{ item }"><StatusBadge :status="item.estado" /></template>
          </DataTable>
        </div>

        <!-- PESTAÑA: ENLACES GENERADOS -->
        <div v-else-if="activeSubTab === 'enlaces'" class="absolute inset-0 flex flex-col">
          <SkeletonBlock v-if="isLoading" variant="tokens" :rows="8" />
          <DataTable v-else @row-click="handleRowClick" :mobile-preview-count="2" :columns="tokenColumns" :data="tokens" search-placeholder="Buscar cliente..." :filter-options="['Activo', 'Usado', 'Expirado', 'Revocado']" filter-column-key="estado">
            <template #header-actions>
              <BaseButton v-if="hasPermission('generar_enlace')" icon="fas fa-plus" @click="modalGenerarRef.open()">Generar Enlace</BaseButton>
            </template>
            
            <template #cell-dias="{ item }">
              <span v-if="item.estado === 'Activo'" :class="['px-2 py-1 rounded-md text-sm font-medium', item.dias >= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' : 'text-slate-600 dark:text-slate-400']">{{ item.dias }} días pendientes</span>
              <span v-else class="text-slate-400 text-xs italic">Cerrado</span>
            </template>

            <template #cell-estado="{ item }">
              <StatusBadge :status="item.estado" />
            </template>
          </DataTable>
        </div>

      </Transition>
    </div>

    <!-- MODAL 1: GESTIÓN DE RESEÑA (Bandeja de Entrada) -->
    <BaseModal v-model="showManageModal" title="Gestión de Reseña" max-width="max-w-xl">
      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
      <p class="text-sm font-semibold text-slate-800 dark:text-white mb-3">{{ selectedReview?.cliente }}</p>
      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Comentario</label>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">{{ selectedReview?.comentario }}</p>
      <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Respuesta pública</label>
      <textarea v-model="replyText" rows="4" class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm" placeholder="Escribe o genera con IA..." />
      <template #footer>
        <BaseButton variant="outline" @click="handleArchive(selectedReview)">Archivar</BaseButton>
        <BaseButton variant="outline" :is-loading="isAILoading" icon="fas fa-magic" @click="callGeminiAI">IA</BaseButton>
        <BaseButton icon="fas fa-check" @click="saveApproval">Publicar</BaseButton>
      </template>
    </BaseModal>

    <!-- MODAL 2: GESTIÓN DE ENLACE INDIVIDUAL (Generados) -->
    <BaseModal v-model="showTokenManageModal" title="Detalle del Enlace">
      <div v-if="selectedToken" class="flex flex-col items-center w-full">
        
        <!-- Tarjeta QR (Similar a GenerarResenaModal pero en modo lectura) -->
        <div class="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-sm">
          <div :class="['text-center py-2 font-semibold text-xs tracking-wide text-white', selectedToken.estado === 'Activo' ? 'bg-brand' : 'bg-slate-500']">
            ESTADO: {{ String(selectedToken.estado).toUpperCase() }}
          </div>
          
          <div class="p-6 flex flex-col items-center">
            <!-- Si está inactivo, bajamos la opacidad del QR -->
            <img :src="selectedToken.qrUrl" alt="QR Code" :class="['w-40 h-40 object-contain rounded-lg transition-opacity', selectedToken.estado !== 'Activo' ? 'opacity-30' : '']" />
            <div v-if="selectedToken.estado === 'Activo'" class="mt-4 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full">
              <input type="text" readonly :value="selectedToken.link" class="bg-transparent flex-1 text-xs font-mono outline-none px-1 text-slate-500 truncate" />
              <button @click="copyToClipboard(selectedToken.link)" class="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-brand hover:text-white rounded text-xs transition-colors"><i class="fas fa-copy"></i></button>
            </div>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-[13px] text-slate-500 dark:text-slate-400 space-y-1">
            <p><strong class="text-slate-800 dark:text-slate-200">Cliente:</strong> {{ selectedToken.cliente }}</p>
            <p><strong class="text-slate-800 dark:text-slate-200">Servicio:</strong> {{ selectedToken.servicio || 'N/A' }}</p>
            <p><strong class="text-slate-800 dark:text-slate-200">Generado:</strong> {{ selectedToken.fecha }}</p>
          </div>
        </div>

        <!-- Botones de Acción Múltiple (Solo si el token está activo) -->
        <div v-if="selectedToken.estado === 'Activo'" class="flex justify-center gap-8 mt-6 w-full">
          <button @click="shareTokenSystem" class="flex flex-col items-center gap-2 group outline-none">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg group-hover:bg-emerald-100 transition-colors cursor-pointer"><i class="fas fa-share-nodes"></i></div>
            <span class="text-[10px] font-semibold text-slate-500">Compartir</span>
          </button>
          
          <button @click="sendTokenWhatsApp" class="flex flex-col items-center gap-2 group outline-none">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-lg group-hover:bg-slate-200 transition-colors cursor-pointer"><i class="fab fa-whatsapp"></i></div>
            <span class="text-[10px] font-semibold text-slate-500">WhatsApp</span>
          </button>
        </div>

      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showTokenManageModal = false">Cerrar</BaseButton>
        <BaseButton v-if="selectedToken?.estado === 'Activo' && hasPermission('editar_resena')" variant="danger" icon="fas fa-ban" @click="revokeLink">Revocar Enlace</BaseButton>
      </template>
    </BaseModal>

    <!-- COMPONENTE EXTERNO PARA CREAR NUEVOS ENLACES -->
    <GenerarResenaModal ref="modalGenerarRef" @success="fetchData" />

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>