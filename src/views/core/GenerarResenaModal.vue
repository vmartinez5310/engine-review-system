<script setup>
import { ref } from 'vue'
import { apiClient } from '../../services/api'

// Emitimos un evento para avisarle al padre que recargue las tablas
const emit = defineEmits(['success'])

const URL_Frontend_App = window.URL_Frontend_App || window.location.origin

const isOpen = ref(false)
const isGenerating = ref(false)
const requestForm = ref({ cliente: '', servicio: '' })
const generatedResult = ref(null)

// --- MÉTODOS PÚBLICOS ---
// Esta es la función que podrá llamar el componente padre para abrir el modal
function open() {
  requestForm.value = { cliente: '', servicio: '' }
  generatedResult.value = null
  isOpen.value = true
}

// --- MÉTODOS INTERNOS ---
function close() {
  isOpen.value = false
}

async function generateReviewLink() {
  if (!requestForm.value.cliente || !requestForm.value.servicio) return window.Swal?.fire('Atención', 'Ingresa cliente y servicio', 'warning')
  
  isGenerating.value = true
  try {
    const response = await apiClient.post('generar_enlace', {
      cliente: requestForm.value.cliente,
      servicio: requestForm.value.servicio
    })

    const link = response.link || `${URL_Frontend_App}/review/${response.id || Math.random().toString(36).substring(2, 9)}`
    const qrUrl = response.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}&margin=10`

    generatedResult.value = { 
      link, 
      cliente: requestForm.value.cliente, 
      servicio: requestForm.value.servicio,
      fecha: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      qrUrl 
    }

    emit('success') // ¡Avisamos al padre que hay un nuevo registro!

  } catch (e) { 
    window.Swal?.fire('Error', e.message || 'No se pudo generar el enlace.', 'error') 
  } finally { 
    isGenerating.value = false 
  }
}

async function shareLinkSystem() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Evalúa nuestro servicio',
        text: `Hola ${generatedResult.value.cliente}, por favor ayúdanos evaluando nuestro servicio:`,
        url: generatedResult.value.link
      })
    } catch (err) { console.log('El usuario canceló al compartir', err) }
  } else {
    copyToClipboard(generatedResult.value.link)
  }
}

function sendWhatsAppNewLink() {
  const text = encodeURIComponent(`Hola ${generatedResult.value.cliente}. Gracias por confiar en nosotros para: ${generatedResult.value.servicio}. ¿Podrías apoyarnos con una breve calificación aquí? ${generatedResult.value.link}`)
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
}

function copyToClipboard(text) { 
  navigator.clipboard.writeText(text)
  window.Swal?.fire({ icon: 'success', title: 'Enlace copiado', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
}

// Exponemos explícitamente la función open() al componente padre
defineExpose({ open })
</script>

<template>
  <BaseModal v-model="isOpen" :title="!generatedResult ? 'Nuevo Enlace de Reseña' : ''">
    <template v-if="!generatedResult" #header-icon><i class="fas fa-link text-brand"></i></template>
    
    <div v-if="!generatedResult" class="space-y-4">
      <div>
        <label class="block text-sm font-semibold mb-1 dark:text-slate-300">Nombre del Cliente</label>
        <input v-model="requestForm.cliente" type="text" class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm transition-colors" placeholder="Ej. Juan Pérez" />
      </div>
      <div>
        <label class="block text-sm font-semibold mb-1 dark:text-slate-300">Servicio Realizado</label>
        <input v-model="requestForm.servicio" type="text" class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm transition-colors" placeholder="Ej. Venta de Casa en Centro" />
      </div>
    </div>

    <div v-else class="flex flex-col items-center animate-fadeIn w-full -mt-4">
      <div class="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 overflow-hidden relative">
        <div class="bg-brand text-white text-center py-3.5 font-semibold text-sm tracking-wide">
          Código QR de Evaluación
        </div>
        <div class="pt-8 pb-6 px-6 flex flex-col items-center bg-white dark:bg-slate-800">
          <img :src="generatedResult.qrUrl" alt="QR Code" class="w-48 h-48 object-contain rounded-lg" />
          <p class="text-[13px] text-slate-500 dark:text-slate-400 mt-6 text-center leading-relaxed">
            Tus clientes pueden escanear este código QR para dejar una reseña rápidamente.
          </p>
        </div>
        <div class="relative flex items-center justify-center h-6 bg-white dark:bg-slate-800">
          <div class="absolute -left-3 w-6 h-6 bg-slate-50 dark:bg-[#0B1120] rounded-full shadow-inner border-r border-slate-100 dark:border-slate-800"></div>
          <div class="w-full border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-5"></div>
          <div class="absolute -right-3 w-6 h-6 bg-slate-50 dark:bg-[#0B1120] rounded-full shadow-inner border-l border-slate-100 dark:border-slate-800"></div>
        </div>
        <div class="p-6 pt-4 bg-white dark:bg-slate-800 text-[13px] text-slate-500 dark:text-slate-400 space-y-2.5">
          <p><strong class="text-slate-800 dark:text-slate-200 font-semibold mr-1">Cliente:</strong> {{ generatedResult.cliente }}</p>
          <p><strong class="text-slate-800 dark:text-slate-200 font-semibold mr-1">Servicio:</strong> {{ generatedResult.servicio }}</p>
          <p><strong class="text-slate-800 dark:text-slate-200 font-semibold mr-1">Emisión:</strong> {{ generatedResult.fecha }}</p>
        </div>
      </div>

      <div class="flex justify-center gap-6 sm:gap-10 mt-8 mb-2">
        <button @click="shareLinkSystem" class="flex flex-col items-center gap-2 group outline-none">
          <div class="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors shadow-sm cursor-pointer"><i class="fas fa-share-nodes"></i></div>
          <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Compartir</span>
        </button>
        <button @click="copyToClipboard(generatedResult.link)" class="flex flex-col items-center gap-2 group outline-none">
          <div class="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors shadow-sm cursor-pointer"><i class="fas fa-link"></i></div>
          <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Copiar</span>
        </button>
        <button @click="sendWhatsAppNewLink" class="flex flex-col items-center gap-2 group outline-none">
          <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xl group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"><i class="fab fa-whatsapp"></i></div>
          <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Enviar</span>
        </button>
      </div>
    </div>

    <template #footer>
      <template v-if="!generatedResult">
        <BaseButton variant="outline" @click="close">Cancelar</BaseButton>
        <BaseButton :is-loading="isGenerating" @click="generateReviewLink">Crear Enlace</BaseButton>
      </template>
      <template v-else>
        <BaseButton variant="outline" class="w-full" @click="close">Cerrar</BaseButton>
      </template>
    </template>
  </BaseModal>
</template>

<style scoped>
.animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }
</style>