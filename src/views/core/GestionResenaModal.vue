<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../../services/supabaseClient'

const isOpen = defineModel({ type: Boolean, default: false })
const props = defineProps({
  review: { type: Object, default: null }
})
const emit = defineEmits(['updated'])

const replyText = ref('')

watch(
  () => [isOpen.value, props.review],
  ([open]) => {
    if (open && props.review) {
      replyText.value = props.review.respuesta_admin || props.review.respuesta || ''
    }
  }
)

function close() {
  isOpen.value = false
}

async function saveApproval() {
  if (!props.review) return
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
    window.Swal?.fire({ icon: 'success', title: 'Publicado', timer: 1500, showConfirmButton: false })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

async function handleArchive() {
  if (!props.review) return
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
  }
}
</script>

<template>
  <BaseModal v-model="isOpen" title="Gestión de Reseña" max-width="max-w-xl">
    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
    <p class="text-sm font-semibold text-slate-800 dark:text-white mb-3"> {{ review?.cliente }} </p>
    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Comentario</label>
    <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap"> {{ review?.comentario }} </p>
    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Respuesta de la empresa</label>
    <textarea
      v-model="replyText"
      rows="4"
      class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
      placeholder="Escribe la respuesta que aparecerá públicamente..."
    />
    <template #footer>
      <BaseButton variant="outline" @click="handleArchive">Archivar</BaseButton>
      <BaseButton icon="fas fa-check" @click="saveApproval">Aprobar y Publicar</BaseButton>
    </template>
  </BaseModal>
</template>
