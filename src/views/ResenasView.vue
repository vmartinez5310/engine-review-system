<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../services/api'
import DataTable from '../components/ui/DataTable.vue'

const props = defineProps({ userRole: { type: String, default: 'ADMINISTRADOR' } })

const reviews = ref([])
const isLoading = ref(true)

// --- ESTADOS: MODAL UNIFICADO (LECTURA / APROBACIÓN / IA / ARCHIVAR) ---
const showModal = ref(false)
const selectedReview = ref(null)
const replyText = ref('')
const isAILoading = ref(false)

// --- ESTADOS: MODAL PEDIR RESEÑA ---
const showRequestModal = ref(false)
const isGenerating = ref(false)
const requestForm = ref({ cliente: '', servicio: '' })
const generatedResult = ref(null)

const URL_Frontend_App = window.URL_Frontend_App || window.location.origin

// --- COLUMNAS DINÁMICAS (Haciendo match EXACTO con el backend) ---
const tableColumns = computed(() => {
  const adminCols = [
    { key: 'fecha', label: 'Fecha' }, 
    { key: 'cliente', label: 'Cliente', required: true }, // 🔒 Obligatoria
    { key: 'servicio', label: 'Servicio/Zona' }, 
    { key: 'legalOk', label: 'LEGAL' },
    { key: 'calificacion', label: 'Calif.', required: true }, // 🔒 Obligatoria
    { key: 'comentario', label: 'Reseña' }, 
    { key: 'estado', label: 'Estado', required: true }, // 🔒 Obligatoria
    { key: 'respuesta', label: 'Respuesta' }
  ]
  
  const userCols = [
    { key: 'fecha', label: 'Fecha' }, 
    { key: 'cliente', label: 'Cliente' },
    { key: 'comentario', label: 'Reseña' }, 
    { key: 'estado', label: 'Estado' }
  ]
  return props.userRole === 'ADMINISTRADOR' ? adminCols : userCols
})

// --- INICIALIZACIÓN ---
onMounted(async () => {
  try {
    reviews.value = await apiClient.post('get_dashboard_reviews')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
})

// --- MÉTODOS: GESTIÓN DE RESEÑAS ---
function openManageModal(review) {
  selectedReview.value = review
  replyText.value = review.respuesta || ''
  showModal.value = true
}

async function saveApproval() {
  const result = await window.Swal?.fire({
    title: '¿Publicar respuesta?',
    text: "La reseña será aprobada y la respuesta será visible.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, publicar',
    cancelButtonText: 'Cancelar'
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
    showModal.value = false
    window.Swal?.fire({ icon: 'success', title: 'Publicado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

async function handleArchive(item) {
  const result = await window.Swal?.fire({
    title: '¿Archivar esta reseña?',
    text: "Se ocultará y no será visible públicamente.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, archivar',
    cancelButtonText: 'Cancelar'
  })
  if (!result?.isConfirmed) return

  try {
    await apiClient.post('update_review', { fila: item.fila, estado: 'Archivado' })
    item.estado = 'Archivado'
    window.Swal?.fire({ icon: 'info', title: 'Archivada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

async function callGeminiAI() {
  if (!replyText.value) replyText.value = "Agradece cordialmente la reseña."
  isAILoading.value = true
  try {
    const prompt = `Actúa como RP. Cliente dijo: "${selectedReview.value.comentario}". Mi borrador: "${replyText.value}". Mejora mi borrador corrigiendo ortografía, tono empático. Devuelve SOLO la respuesta.`
    const res = await apiClient.post('call_ai', { prompt })
    replyText.value = res.texto
  } catch (e) {
    window.Swal?.fire('Error de IA', e.message, 'error')
  } finally {
    isAILoading.value = false
  }
}

// --- MÉTODOS: PEDIR RESEÑA ---
async function generateReviewLink() {
  if (!requestForm.value.cliente || !requestForm.value.servicio) {
    window.Swal?.fire('Atención', 'Ingresa cliente y servicio.', 'warning')
    return
  }
  isGenerating.value = true
  try {
    await new Promise(r => setTimeout(r, 800)) // Simulación
    const uniqueId = Math.random().toString(36).substring(2, 9)
    const link = `${URL_Frontend_App}/review/${uniqueId}`
    generatedResult.value = {
      link, cliente: requestForm.value.cliente,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link)}`
    }
  } catch (e) {
    window.Swal?.fire('Error', 'No se pudo generar el enlace.', 'error')
  } finally {
    isGenerating.value = false
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
  window.Swal?.fire({ icon: 'success', title: 'Enlace copiado', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
}

async function shareNative() {
  if (!generatedResult.value) return
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Califica nuestro servicio',
        text: `Hola ${generatedResult.value.cliente}, nos encantaría conocer tu opinión.`,
        url: generatedResult.value.link,
      })
    } catch (e) { console.log('Compartir cancelado') }
  } else {
    copyToClipboard(generatedResult.value.link)
  }
}

function closeRequestModal() {
  showRequestModal.value = false
  requestForm.value = { cliente: '', servicio: '' }
  generatedResult.value = null
}
</script>

<template>
  <div class="h-full flex flex-col gap-4">

    <!-- TABLA CENTRALIZADA -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <DataTable
        :columns="tableColumns"
        :data="reviews" 
        :is-loading="isLoading" 
        search-placeholder="Buscar reseña o cliente..."
        :filter-options="['Pendiente', 'Aprobado', 'Archivado']" 
        filter-column-key="estado"
      >
        <!-- Slot: Botón Pedir Reseña -->
        <template #header-actions>
          <button @click="showRequestModal = true" class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:brightness-110 transition flex items-center gap-2 whitespace-nowrap">
            <i class="fas fa-paper-plane"></i> <span class="hidden sm:inline">Pedir Reseña</span>
          </button>
        </template>

        <!-- Slot: Reseña Truncada -->
        <template #cell-comentario="{ item }">
          <div class="max-w-[120px] 2xl:max-w-[200px] truncate text-slate-700 dark:text-slate-300">
            {{ item.comentario }}
          </div>
          <button v-if="userRole !== 'USUARIO' && item.comentario?.length > 30" @click="openManageModal(item)" class="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-0.5">
            Leer y Gestionar
          </button>
        </template>

        <!-- Slot: Indicador Legal (legalOk) -->
        <template #cell-legalOk="{ item }">
          <div class="text-center">
            <i v-if="item.legalOk" 
               class="fas fa-check-circle text-emerald-500" 
               title="Aceptó términos legales"></i>
            <i v-else 
               class="fas fa-minus text-slate-300 dark:text-slate-600" 
               title="No aceptó / Sin registro"></i>
          </div>
        </template>

        <!-- Slot: Respuesta Truncada -->
        <template #cell-respuesta="{ item }">
          <div v-if="item.respuesta" class="max-w-[120px] 2xl:max-w-[200px] truncate text-slate-700 dark:text-slate-300">
            {{ item.respuesta }}
          </div>
          <span v-else class="text-slate-400 italic text-[11px]">Sin respuesta</span>
        </template>

        <!-- Slot: Estado visual -->
        <template #cell-estado="{ item }">
          <span v-if="item.estado === 'Aprobado'" class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">Aprobado</span>
          <span v-else-if="item.estado === 'Pendiente'" class="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">Pendiente</span>
          <span v-else class="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-semibold">Archivado</span>
        </template>

        <!-- Slot: Acciones Rápidas -->
        <template #actions="{ item }">
          <div v-if="userRole !== 'USUARIO'" class="flex gap-2">
            <button @click="openManageModal(item)" title="Gestionar reseña" class="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition shadow-sm">
              <i class="fas fa-edit"></i>
            </button>
          </div>
          <span v-else class="text-xs text-slate-400 italic">Solo lectura</span>
        </template>
      </DataTable>
    </div>

    <!-- MODAL UNIFICADO: LECTURA COMPLETA, IA Y ACCIONES -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
        
        <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between">
          <h3 class="font-bold dark:text-white">Gestión de Reseña</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-200"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="p-6">
          <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
          <div class="mb-5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm dark:text-slate-300">{{ selectedReview.cliente }}</div>

          <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Asesor</label>
          <div class="mb-5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm dark:text-slate-300">{{ selectedReview.asesor }}</div>

          <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Comentario del Cliente</label>
          <div class="mb-5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm italic dark:text-slate-300 max-h-40 overflow-y-auto custom-scrollbar">
            "{{ selectedReview.comentario }}"
          </div>

          <div class="flex justify-between items-center mb-2">
            <label class="text-xs font-bold text-slate-500 uppercase">Respuesta del Negocio</label>
            <button @click="callGeminiAI" :disabled="isAILoading" class="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition flex items-center gap-1.5 font-medium">
              <i :class="isAILoading ? 'fas fa-spinner fa-spin' : 'fas fa-magic'"></i> Asistente IA
            </button>
          </div>
          <textarea v-model="replyText" rows="4" placeholder="Escribe o genera la respuesta pública..." class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand dark:text-white text-sm"></textarea>
        </div>

        <div class="p-5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50">
          <button @click="showModal = false" class="px-5 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-white text-sm font-medium transition">Cerrar</button>
          <button v-if="selectedReview.estado !== 'Archivado'" @click="handleArchive(selectedReview); showModal = false" class="px-5 py-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-sm font-semibold transition">Archivar</button>
          <button @click="saveApproval" class="px-5 py-2.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold transition shadow-md">Publicar / Aprobar</button>
        </div>

      </div>
    </div>

    <!-- MODAL: PEDIR RESEÑA -->
    <div v-if="showRequestModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg dark:text-white"><i class="fas fa-link text-brand mr-2"></i>Generar Enlace</h3>
          <button @click="closeRequestModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i class="fas fa-times"></i></button>
        </div>

        <div v-if="!generatedResult" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-1 dark:text-slate-300">Cliente</label>
            <input v-model="requestForm.cliente" type="text" class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand dark:text-white text-sm" placeholder="Nombre completo" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1 dark:text-slate-300">Servicio</label>
            <input v-model="requestForm.servicio" type="text" class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand dark:text-white text-sm" placeholder="Ej. Asesoría" />
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="closeRequestModal" class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">Cancelar</button>
            <button @click="generateReviewLink" :disabled="isGenerating" class="px-5 py-2 rounded-xl text-white bg-brand hover:brightness-110 font-semibold transition flex items-center gap-2">
              <i v-if="isGenerating" class="fas fa-spinner fa-spin"></i>
              <span>{{ isGenerating ? 'Generando...' : 'Crear Enlace' }}</span>
            </button>
          </div>
        </div>

        <div v-else class="space-y-5 text-center">
          <div class="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium border border-emerald-200 dark:border-emerald-800">
            <i class="fas fa-check-circle mr-1"></i> Enlace listo para {{ generatedResult.cliente }}
          </div>
          <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <input type="text" readonly :value="generatedResult.link" class="bg-transparent flex-1 text-xs font-mono dark:text-slate-300 outline-none px-2" />
            <button @click="copyToClipboard(generatedResult.link)" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-brand hover:text-white rounded-lg text-xs font-semibold transition">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <img :src="generatedResult.qrUrl" alt="QR" class="w-32 h-32 mx-auto border p-2 rounded-xl bg-white" />
          <div class="grid grid-cols-2 gap-3">
            <button @click="shareNative" class="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition">
              <i class="fas fa-share-nodes mr-1"></i> Compartir
            </button>
            <button @click="closeRequestModal" class="py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 dark:text-white rounded-xl text-sm font-semibold transition">
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>