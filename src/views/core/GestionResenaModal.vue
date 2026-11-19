<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../../services/supabaseClient'
import BaseModal from '../../components/ui/BaseModal.vue'
import BaseButton from '../../components/ui/BaseButton.vue'

const isOpen = defineModel({ type: Boolean, default: false })
const props = defineProps({
  review: { type: Object, default: null }
})
const emit = defineEmits(['updated'])

const replyText = ref('')
const replyError = ref('')
const isProcessing = ref(false)

watch(
  () => [isOpen.value, props.review],
  ([open]) => {
    if (open && props.review) {
      replyText.value = props.review.respuesta_admin || props.review.respuesta || ''
      replyError.value = ''
    }
  }
)

function close() {
  isOpen.value = false
}

async function saveApproval() {
  if (!props.review) return

  if (!replyText.value.trim()) {
    replyError.value = 'Debes redactar una respuesta oficial antes de aprobar y publicar.'
    return
  }

  isProcessing.value = true
  replyError.value = ''
  try {
    const { error } = await supabase
      .from('resenas')
      .update({
        estado: 'Aprobado',
        respuesta_admin: replyText.value.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', props.review.id)

    if (error) throw error
    isOpen.value = false
    emit('updated')
    window.Swal?.fire({
      icon: 'success',
      title: 'Reseña aprobada y publicada',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isProcessing.value = false
  }
}

async function handleArchive() {
  if (!props.review) return
  isProcessing.value = true
  try {
    const { error } = await supabase
      .from('resenas')
      .update({
        estado: 'Archivado',
        updated_at: new Date().toISOString()
      })
      .eq('id', props.review.id)

    if (error) throw error
    isOpen.value = false
    emit('updated')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <BaseModal v-model="isOpen" title="Gestión y Respuesta de Reseña" max-width="max-w-xl">
    <div class="space-y-4 text-xs">
      <!-- Ficha de la reseña emitida por el cliente -->
      <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-lg space-y-2.5">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-slate-400 font-medium">Cliente</span>
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ review?.cliente || 'Cliente' }}</p>
          </div>
          <div class="text-right">
            <span class="text-slate-400 font-medium">Calificación</span>
            <div class="flex items-center gap-1 text-amber-400 text-sm font-semibold">
              <span>★</span>
              <span>{{ review?.calificacion }} / 5.0</span>
            </div>
          </div>
        </div>

        <div v-if="review?.servicio" class="pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span class="text-slate-400">Servicio evaluado:</span>
          <span class="ml-1 text-slate-700 dark:text-slate-300 font-medium">{{ review.servicio }}</span>
        </div>

        <div class="pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span class="text-slate-400 block mb-1">Testimonio del cliente:</span>
          <p class="text-slate-800 dark:text-slate-200 italic bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200/60 dark:border-slate-700/60">
            "{{ review?.comentario || 'Sin comentario escrito.' }}"
          </p>
        </div>
      </div>

      <!-- Campo de respuesta del operador obligatorio -->
      <div>
        <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
          Respuesta oficial del operador / empresa <span class="text-rose-500">*</span>
        </label>
        <textarea
          v-model="replyText"
          rows="3"
          class="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-lg outline-none text-xs text-slate-800 dark:text-slate-200 focus:border-brand"
          :class="replyError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'"
          placeholder="Escribe la respuesta que aparecerá públicamente debajo del testimonio..."
        />
        <p v-if="replyError" class="text-rose-500 text-xs mt-1">{{ replyError }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center w-full">
        <BaseButton variant="outline" :disabled="isProcessing" @click="handleArchive">
          Archivar
        </BaseButton>
        <BaseButton :is-loading="isProcessing" @click="saveApproval">
          Aprobar y Publicar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
