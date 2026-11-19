<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { hasPermission } from '../../composables/useAuth'
import ResenasTable from './ResenasTable.vue'
import SeguimientosTable from './SeguimientosTable.vue'
import GenerarResenaModal from './GenerarResenaModal.vue'
import GestionResenaModal from './GestionResenaModal.vue'

const props = defineProps({
  initialSubTab: { type: String, default: null }
})

const activeSubTab = ref('recibidas')
const isLoading = ref(true)
const reviews = ref([])
const tokens = ref([])

const showManageModal = ref(false)
const selectedReview = ref(null)

const showGenerateModal = ref(false)
const selectedToken = ref(null)

async function fetchData() {
  isLoading.value = true
  try {
    if (activeSubTab.value === 'recibidas') {
      const { data, error } = await supabase
        .from('resenas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      reviews.value = (data || []).map(r => ({
        ...r,
        legalOk: r.legal_ok,
        respuesta: r.respuesta_admin
      }))
    } else if (activeSubTab.value === 'por_evaluar') {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      const hoy = new Date()
      tokens.value = (data || []).map(t => {
        const fechaEnvio = t.fecha_envio ? new Date(t.fecha_envio) : new Date()
        const dias = Math.floor(Math.abs(hoy - fechaEnvio) / 864e5)
        return {
          id: t.id_enlace,
          fecha: t.fecha_envio,
          cliente: t.nombre_cliente,
          servicio: t.zona_servicio,
          dias,
          asesor: t.user_id_admin,
          estado: t.estado === 'Activo' && dias > 7 ? 'Expirado' : t.estado,
          url_generada: t.url_generada,
          rawId: t.id
        }
      })
    }
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

function handleFabTrigger() {
  openNewLinkModal()
}

onMounted(() => {
  let targetSub = props.initialSubTab
  if (targetSub === 'recibidas' || targetSub === 'por_evaluar') {
    activeSubTab.value = targetSub
  }
  fetchData()
  window.addEventListener('fab-new-invitation', handleFabTrigger)
})

onUnmounted(() => {
  window.removeEventListener('fab-new-invitation', handleFabTrigger)
})

watch(() => props.initialSubTab, (newSub) => {
  if (newSub === 'recibidas' || newSub === 'por_evaluar') {
    activeSubTab.value = newSub
  }
})

watch(activeSubTab, fetchData)

function openNewLinkModal() {
  selectedToken.value = null
  showGenerateModal.value = true
}

function handleReviewClick(row) {
  if (hasPermission('editar_resena')) {
    selectedReview.value = row
    showManageModal.value = true
  }
}

function handleTokenClick(row) {
  selectedToken.value = row
  showGenerateModal.value = true
}

async function revokeToken(item) {
  if (!hasPermission('editar_resena') || !item) return
  const result = await window.Swal?.fire({
    title: '¿Inhabilitar enlace?',
    text: `Se cancelará el token de ${item.cliente}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48'
  })
  if (!result?.isConfirmed) return

  try {
    const { error } = await supabase
      .from('tokens')
      .update({ estado: 'Cancelado' })
      .eq('id_enlace', item.id)

    if (error) throw error
    item.estado = 'Revocado'
    showGenerateModal.value = false
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <!-- Pestañas simples sin mayúsculas sostenidas -->
    <div class="flex items-center gap-1 border-b border-slate-200/60 dark:border-slate-800/60 pb-2 shrink-0 text-xs">
      <button
        type="button"
        :class="[
          'px-3 py-1.5 font-medium transition-colors cursor-pointer rounded',
          activeSubTab === 'recibidas'
            ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        ]"
        @click="activeSubTab = 'recibidas'"
      >
        Bandeja de entrada
      </button>

      <button
        v-if="hasPermission('ver_seguimientos')"
        type="button"
        :class="[
          'px-3 py-1.5 font-medium transition-colors cursor-pointer rounded',
          activeSubTab === 'por_evaluar'
            ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        ]"
        @click="activeSubTab = 'por_evaluar'"
      >
        Monitoreo de enlaces
      </button>
    </div>

    <div class="flex-1 overflow-hidden flex flex-col relative">
      <div v-if="activeSubTab === 'recibidas'" class="h-full flex flex-col">
        <ResenasTable
          :data="reviews"
          :is-loading="isLoading"
          @open-modal="openNewLinkModal"
          @row-click="handleReviewClick"
        />
      </div>
      <div v-else-if="activeSubTab === 'por_evaluar'" class="h-full flex flex-col">
        <SeguimientosTable
          :data="tokens"
          :is-loading="isLoading"
          @open-modal="openNewLinkModal"
          @row-click="handleTokenClick"
          @revoke="revokeToken"
        />
      </div>
    </div>

    <GestionResenaModal v-model="showManageModal" :review="selectedReview" @updated="fetchData" />
    <GenerarResenaModal
      v-model="showGenerateModal"
      :initial-token="selectedToken"
      @success="fetchData"
      @revoke="revokeToken"
    />
  </div>
</template>
