<script setup>
import { ref, watch } from 'vue'
import { apiClient } from '../../services/api'

const isOpen = defineModel({ type: Boolean, default: false })
const props = defineProps({
  review: { type: Object, default: null }
})
const emit = defineEmits(['updated'])

const replyText = ref('')
const isAILoading = ref(false)

watch(
  () => [isOpen.value, props.review],
  ([open]) => {
    if (open && props.review) {
      replyText.value = props.review.respuesta || ''
    }
  }
)

function close() {
  isOpen.value = false
}

async function saveApproval() {
  if (!props.review) return
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
      fila: props.review.fila,
      estado: 'Aprobado',
      respuesta: replyText.value
    })
    props.review.estado = 'Aprobado'
    props.review.respuesta = replyText.value
    isOpen.value = false
    emit('updated')
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

async function handleArchive() {
  if (!props.review) return
  const result = await window.Swal?.fire({
    title: '¿Archivar esta reseña?',
    text: 'Se ocultará públicamente',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444'
  })
  if (!result?.isConfirmed) return

  try {
    await apiClient.post('update_review', { fila: props.review.fila, estado: 'Archivado' })
    props.review.estado = 'Archivado'
    isOpen.value = false
    emit('updated')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

async function callGeminiAI() {
  if (!props.review) return
  if (!replyText.value) replyText.value = 'Agradece cordialmente la reseña.'
  isAILoading.value = true
  try {
    const res = await apiClient.post('call_ai', {
      prompt: `Actúa como RP. Cliente dijo: "${props.review.comentario}". Borrador: "${replyText.value}". Mejora y devuelve SOLO respuesta.`
    })
    replyText.value = res.texto
  } catch (e) {
    window.Swal?.fire('Error de IA', e.message, 'error')
  } finally {
    isAILoading.value = false
  }
}
</script>

<template>
  <BaseModal v-model="isOpen" title="Gestión de Reseña" max-width="max-w-xl">
    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
    <p class="text-sm font-semibold text-slate-800 dark:text-white mb-3">{{ review?.cliente }}</p>
    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Comentario</label>
    <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">{{ review?.comentario }}</p>
    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Respuesta pública</label>
    <textarea
      v-model="replyText"
      rows="4"
      class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
      placeholder="Escribe o genera con IA..."
    />
    <template #footer>
      <BaseButton variant="outline" @click="handleArchive">Archivar</BaseButton>
      <BaseButton variant="outline" :is-loading="isAILoading" icon="fas fa-magic" @click="callGeminiAI">IA</BaseButton>
      <BaseButton icon="fas fa-check" @click="saveApproval">Publicar</BaseButton>
    </template>
  </BaseModal>
</template>
