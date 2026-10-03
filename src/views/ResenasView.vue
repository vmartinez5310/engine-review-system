<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../services/api'
import DataTable from '../components/ui/DataTable.vue'

const props = defineProps({ userRole: String })

const reviews = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')

// Estado del Modal de Aprobación/IA
const showModal = ref(false)
const selectedReview = ref(null)
const replyText = ref('')
const isAILoading = ref(false)

// Carga Inicial
onMounted(async () => {
  try {
    reviews.value = await apiClient.post('get_dashboard_reviews')
  } catch (e) {
    window.Swal.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
})

// Filtro computado reactivo (Adiós a los forEach manuales)
const filteredReviews = computed(() => {
  return reviews.value.filter(r => {
    const matchesSearch = (r.cliente || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (r.comentario || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || r.estado === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

function openApproveModal(review) {
  selectedReview.value = review
  replyText.value = review.respuesta || ''
  showModal.value = true
}

async function saveApproval() {
  try {
    await apiClient.post('update_review', {
      fila: selectedReview.value.fila,
      estado: 'Aprobado',
      respuesta: replyText.value
    })
    selectedReview.value.estado = 'Aprobado'
    selectedReview.value.respuesta = replyText.value
    showModal.value = false
    window.Swal.fire({ icon: 'success', title: 'Publicado', toast: true, position: 'top-end', timer: 2000 })
  } catch (e) {
    window.Swal.fire('Error', e.message, 'error')
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
    window.Swal.fire('Error de IA', e.message, 'error')
  } finally {
    isAILoading.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-4">

    <!-- Topbar: Buscador y Filtros -->
    <div
      class="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between">
      <input v-model="searchQuery" type="text" placeholder="Buscar cliente..."
        class="w-full md:w-80 p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand" />
      <select v-model="statusFilter"
        class="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2">
        <option value="all">Todos los estados</option>
        <option value="Pendiente">Pendientes</option>
        <option value="Aprobado">Aprobadas</option>
      </select>
    </div>

    <!-- Implementación de la Tabla DRY -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <DataTable
        :columns="[{ key: 'fecha', label: 'Fecha' }, { key: 'cliente', label: 'Cliente' }, { key: 'comentario', label: 'Reseña' }, { key: 'estado', label: 'Estado' }]"
        :data="filteredReviews" :is-loading="isLoading">

        <!-- Slot: Personalización visual de la columna Estado -->
        <template #cell-estado="{ item }">
          <span v-if="item.estado === 'Aprobado'"
            class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">Aprobado</span>
          <span v-else-if="item.estado === 'Pendiente'"
            class="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">Pendiente</span>
          <span v-else
            class="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-semibold">Archivada</span>
        </template>

        <!-- Slot: Acciones RBAC -->
        <template #actions="{ item }">
          <div v-if="userRole !== 'USUARIO'" class="flex gap-2">
            <button v-if="item.estado !== 'Aprobado'" @click="openApproveModal(item)" title="Aprobar reseña"
              class="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition shadow-sm">
              <i class="fas fa-check"></i>
            </button>
            <button title="Archivar reseña"
              class="text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition shadow-sm">
              <i class="fas fa-eye-slash"></i>
            </button>
          </div>
          <span v-else class="text-xs text-slate-400 italic">Solo lectura</span>
        </template>
      </DataTable>
    </div>

    <!-- Modal de Aprobación e IA -->
    <div v-if="showModal"
      class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div class="p-6 border-b flex justify-between">
          <h3 class="font-bold">Aprobar y Responder</h3>
          <button @click="showModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="p-6">
          <div class="mb-4 p-4 bg-slate-50 rounded-xl text-sm italic">"{{ selectedReview.comentario }}"</div>
          <div class="flex justify-between mb-2">
            <label class="text-sm font-semibold">Tu Respuesta</label>
            <button @click="callGeminiAI" :disabled="isAILoading"
              class="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
              <i :class="isAILoading ? 'fas fa-spinner fa-spin' : 'fas fa-magic'"></i> IA
            </button>
          </div>
          <textarea v-model="replyText" rows="5"
            class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-brand"></textarea>
        </div>
        <div class="p-6 flex justify-end gap-3">
          <button @click="showModal = false" class="px-5 py-2.5 rounded-xl hover:bg-slate-100">Cancelar</button>
          <button @click="saveApproval" class="px-5 py-2.5 rounded-xl text-white bg-emerald-600">Publicar</button>
        </div>
      </div>
    </div>

  </div>
</template>