<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { authState, hasPermission } from '../../composables/useAuth'

const props = defineProps({
  initialToken: { type: Object, default: null }
})

const isOpen = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['success', 'revoke'])

const isGenerating = ref(false)
const copied = ref(false)
const requestForm = ref({ cliente: '', servicio: '' })
const generatedResult = ref(null)

const buildQrUrl = (link) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}&margin=8`

watch(
  [isOpen, () => props.initialToken],
  ([open, token]) => {
    if (!open) return
    copied.value = false
    if (token) {

      const link = token.url || token.link || token.url_generada || ''
      generatedResult.value = {
        id: token.id_enlace || token.id,
        estado: token.estado || 'Activo',
        link,
        cliente: token.nombre_cliente || token.cliente,
        servicio: token.zona_servicio || token.servicio,
        asesor: token.asesor || token.user_id_admin,
        fecha: token.fecha_envio || token.fecha,
        qrUrl: link ? buildQrUrl(link) : ''
      }
    } else {
      requestForm.value = { cliente: '', servicio: '' }
      generatedResult.value = null
    }
  },
  { immediate: true }
)

const modalTitle = computed(() => {
  if (!generatedResult.value) return 'Nuevo Enlace de Reseña'
  return generatedResult.value.id ? `Enlace ${generatedResult.value.id}` : 'Enlace de Evaluación'
})

function close() {
  isOpen.value = false
}

async function generateReviewLink() {
  if (!requestForm.value.cliente.trim() || !requestForm.value.servicio.trim()) {
    return window.Swal?.fire('Atención', 'Ingresa el nombre del cliente y el servicio', 'warning')
  }

  isGenerating.value = true
  try {
    const linkId = 'LNK-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Obtener URL base de configuración
    const { data: cfgRow } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'URL_Frontend_App')
      .maybeSingle()

    const baseUrl = cfgRow?.valor || window.location.origin
    const fullUrl = `${baseUrl.replace(/\/$/, '')}/?t=${linkId}`
    const userId = authState.user?.userId || 'ADMIN'

    const { error } = await supabase.from('tokens').insert({
      id_enlace: linkId,
      user_id_admin: userId,
      fecha_envio: new Date().toISOString().split('T')[0],
      nombre_cliente: requestForm.value.cliente.trim(),
      zona_servicio: requestForm.value.servicio.trim(),
      url_generada: fullUrl,
      estado: 'Activo'
    })

    if (error) throw error

    generatedResult.value = {
      id: linkId,
      estado: 'Activo',
      link: fullUrl,
      cliente: requestForm.value.cliente.trim(),
      servicio: requestForm.value.servicio.trim(),
      fecha: new Date().toISOString().split('T')[0],
      qrUrl: buildQrUrl(fullUrl)
    }

    emit('success')
  } catch (e) {
    window.Swal?.fire('Error', e.message || 'No se pudo generar el enlace.', 'error')
  } finally {
    isGenerating.value = false
  }
}

async function copyToClipboard(text) {
  if (!text) return
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
  window.Swal?.fire({
    icon: 'success',
    title: 'Enlace copiado',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1400
  })
}

function sendWhatsAppLink() {
  if (!generatedResult.value?.link) return
  const text = encodeURIComponent(
    `Hola ${generatedResult.value.cliente}. ¿Podrías apoyarnos con tu valoración en el siguiente enlace? ${generatedResult.value.link}`
  )
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
}
</script>

<template>
  <BaseModal v-model="isOpen" :title="modalTitle" max-width="max-w-md">
    <template #header-icon>
      <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
        <i :class="generatedResult ? 'fas fa-qrcode text-xs' : 'fas fa-link text-xs'"></i>
      </div>
    </template>

    <template v-if="generatedResult?.estado" #header-extra>
      <StatusBadge :status="generatedResult.estado" />
    </template>

    <form v-if="!generatedResult" class="space-y-4" @submit.prevent="generateReviewLink">
      <BaseInput
        v-model="requestForm.cliente"
        label="Nombre del Cliente"
        placeholder="Ej. Luis González"
        icon="fas fa-user"
      />
      <BaseInput
        v-model="requestForm.servicio"
        label="Servicio / Operación"
        placeholder="Ej. Asesoría de Inmuebles"
        icon="fas fa-briefcase"
      />
    </form>

    <div v-else class="flex flex-col items-center w-full space-y-4 select-none">
      <div class="w-full rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl flex flex-col items-center text-center">
        <img
          v-if="generatedResult.qrUrl"
          :src="generatedResult.qrUrl"
          alt="QR"
          class="w-36 h-36 object-contain rounded-xl"
        />
        <p class="text-xs text-slate-400 mt-3 font-mono break-all">{{ generatedResult.link }}</p>
      </div>

      <div class="w-full grid grid-cols-2 gap-2">
        <button
          type="button"
          class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer"
          @click="sendWhatsAppLink"
        >
          <i class="fab fa-whatsapp"></i> WhatsApp
        </button>
        <button
          type="button"
          class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 cursor-pointer"
          @click="copyToClipboard(generatedResult.link)"
        >
          <i :class="copied ? 'fas fa-check' : 'fas fa-copy'"></i>
          {{ copied ? 'Copiado' : 'Copiar' }}
        </button>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <BaseButton variant="outline" @click="close">Cerrar</BaseButton>
        <BaseButton v-if="!generatedResult" :is-loading="isGenerating" @click="generateReviewLink">
          Crear Enlace
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
