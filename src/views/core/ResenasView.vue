<script setup>
import { ref, onMounted, watch } from 'vue'
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

onMounted(() => {
  let targetSub = props.initialSubTab
  if (targetSub === 'recibidas' || targetSub === 'por_evaluar') {
    activeSubTab.value = targetSub
  }
  fetchData()
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
    title: '¿Revocar enlace?',
    text: `Se inhabilitará el enlace de ${item.cliente}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444'
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
        <div v-if="activeSubTab === 'recibidas'" key="recibidas" class="absolute inset-0 flex flex-col">
          <ResenasTable
            :data="reviews"
            :is-loading="isLoading"
            @open-modal="openNewLinkModal"
            @row-click="handleReviewClick"
          />
        </div>
        <div v-else-if="activeSubTab === 'por_evaluar'" key="por_evaluar" class="absolute inset-0 flex flex-col">
          <SeguimientosTable
            :data="tokens"
            :is-loading="isLoading"
            @open-modal="openNewLinkModal"
            @row-click="handleTokenClick"
            @revoke="revokeToken"
          />
        </div>
      </Transition>
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

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
