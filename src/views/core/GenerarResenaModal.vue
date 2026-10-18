<script setup>
import { ref, watch, computed } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'

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
      const link = token.url || token.link || ''
      generatedResult.value = {
        id: token.id,
        fila: token.fila,
        estado: token.estado || 'Activo',
        link,
        cliente: token.cliente,
        servicio: token.servicio,
        asesor: token.asesor,
        fecha: token.fecha,
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
  return generatedResult.value.id ? `Pase ${generatedResult.value.id}` : 'Pase de Evaluación'
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
    const response = await apiClient.post('generate_link', {
      nombre: requestForm.value.cliente.trim(),
      servicio: requestForm.value.servicio.trim()
    })

    const link = response.url || response.link
    if (!link) throw new Error('El servidor no devolvió una URL válida')

    generatedResult.value = {
      id: response.id || 'NUEVO',
      estado: 'Activo',
      link,
      cliente: requestForm.value.cliente.trim(),
      servicio: requestForm.value.servicio.trim(),
      fecha: new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      qrUrl: buildQrUrl(link)
    }

    emit('success', {
      url: link,
      cliente: requestForm.value.cliente.trim(),
      servicio: requestForm.value.servicio.trim()
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message || 'No se pudo generar el enlace.', 'error')
  } finally {
    isGenerating.value = false
  }
}

async function copyToClipboard(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
    window.Swal?.fire({
      icon: 'success',
      title: 'Enlace copiado',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1400
    })
  } catch {
    /* fallback silencioso */
  }
}

async function shareLinkSystem() {
  if (!generatedResult.value?.link) return
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Evalúa nuestro servicio',
        text: `Hola ${generatedResult.value.cliente}, por favor ayúdanos evaluando nuestro servicio:`,
        url: generatedResult.value.link
      })
    } catch {
      /* cancelado por el usuario */
    }
  } else {
    copyToClipboard(generatedResult.value.link)
  }
}

function sendWhatsAppLink() {
  if (!generatedResult.value?.link) return
  const text = encodeURIComponent(
    `Hola ${generatedResult.value.cliente}. Gracias por confiar en nosotros para: ${generatedResult.value.servicio || 'nuestro servicio'}. ¿Podrías apoyarnos con una breve calificación aquí? ${generatedResult.value.link}`
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

    <!-- MODO 1: FORMULARIO DE CREACIÓN (CON ENVÍO RÁPIDO CON ENTER) -->
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
        placeholder="Ej. Compra de Departamento"
        icon="fas fa-briefcase"
      />
      <p class="text-[11px] text-slate-400 dark:text-slate-500">
        Se generará un código QR y un enlace único de un solo uso para este cliente.
      </p>
    </form>

    <!-- MODO 2: PASE DIGITAL EJECUTIVO (COMPACTO Y ADAPTABLE A CUALQUIER PANTALLA) -->
    <div v-else class="flex flex-col items-center animate-fadeIn w-full space-y-3.5 select-none">
      
      <!-- Tarjeta del Ticket -->
      <div class="w-full rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-inner">
        
        <!-- Área superior: QR interactivo + Resumen del cliente -->
        <div class="p-4 flex flex-col items-center text-center relative">
          <button
            type="button"
            title="Haz clic para copiar el enlace"
            class="group relative p-2.5 bg-white rounded-2xl shadow-md border border-slate-200/60 transition-transform active:scale-95 cursor-pointer"
            @click="copyToClipboard(generatedResult.link)"
          >
            <img
              v-if="generatedResult.qrUrl"
              :src="generatedResult.qrUrl"
              alt="QR Code"
              class="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-lg"
            />
            <div class="absolute inset-0 rounded-2xl bg-slate-900/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
              <i class="fas fa-copy text-sky-400 text-base"></i>
              <span>Copiar link</span>
            </div>
          </button>

          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5">
            Escanea con la cámara o toca el QR para copiar el enlace
          </p>
        </div>

        <!-- Divisor perforado estilo Ticket -->
        <div class="relative flex items-center justify-center h-4">
          <div class="absolute -left-2.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full border-r border-slate-200 dark:border-slate-800"></div>
          <div class="w-full border-t border-dashed border-slate-200 dark:border-slate-800 mx-4"></div>
          <div class="absolute -right-2.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full border-l border-slate-200 dark:border-slate-800"></div>
        </div>

        <!-- Metadatos en Grid 2x2 (Ahorra espacio vertical) -->
        <div class="px-4 pb-3.5 pt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div class="min-w-0">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Cliente</span>
            <span class="font-bold text-slate-800 dark:text-slate-100 truncate block">{{ generatedResult.cliente }}</span>
          </div>

          <div class="min-w-0">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Servicio</span>
            <span class="font-medium text-slate-700 dark:text-slate-300 truncate block">{{ generatedResult.servicio }}</span>
          </div>

          <div v-if="generatedResult.asesor" class="min-w-0">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Asesor</span>
            <span class="font-medium text-slate-600 dark:text-slate-400 truncate block">{{ generatedResult.asesor }}</span>
          </div>

          <div class="min-w-0">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Emisión</span>
            <span class="font-mono text-slate-600 dark:text-slate-400 truncate block">{{ generatedResult.fecha }}</span>
          </div>
        </div>
      </div>

      <!-- Barra de Acciones Directas (Fricción Cero) -->
      <div v-if="generatedResult.estado === 'Activo'" class="w-full grid grid-cols-3 gap-2">
        <button
          type="button"
          class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          @click="sendWhatsAppLink"
        >
          <i class="fab fa-whatsapp text-sm"></i>
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          :class="[
            'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer',
            copied
              ? 'bg-sky-500 text-slate-950 border-sky-400'
              : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/20'
          ]"
          @click="copyToClipboard(generatedResult.link)"
        >
          <i :class="copied ? 'fas fa-check text-xs' : 'fas fa-copy text-xs'"></i>
          <span>{{ copied ? '¡Copiado!' : 'Copiar' }}</span>
        </button>

        <button
          type="button"
          class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
          @click="shareLinkSystem"
        >
          <i class="fas fa-share-nodes text-xs"></i>
          <span>Compartir</span>
        </button>
      </div>
    </div>

    <!-- FOOTER CON JERARQUÍA CLARA (Destructivo a la izquierda, Cierre a la derecha) -->
    <template #footer>
      <template v-if="!generatedResult">
        <div class="flex items-center justify-end gap-2.5 w-full">
          <BaseButton variant="outline" @click="close">Cancelar</BaseButton>
          <BaseButton :is-loading="isGenerating" icon="fas fa-bolt" @click="generateReviewLink">
            Crear Enlace
          </BaseButton>
        </div>
      </template>

      <template v-else>
        <div>
          <button
            v-if="props.initialToken && generatedResult.estado === 'Activo' && hasPermission('editar_resena')"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
            @click="emit('revoke', props.initialToken)"
          >
            <i class="fas fa-ban text-[11px]"></i>
            <span>Revocar enlace</span>
          </button>
        </div>

        <BaseButton variant="outline" @click="close">Cerrar</BaseButton>
      </template>
    </template>
  </BaseModal>
</template>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.22s ease-out forwards;
}
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>