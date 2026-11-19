<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../services/supabaseClient'

const props = defineProps({
  inviteToken: { type: String, required: true },
  config: { type: Object, default: () => ({}) }
})

const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref('')
const success = ref(false)
const invalid = ref(false)

const tokenRecord = ref(null)
const nombre = ref('')
const zona = ref('')
const calificacion = ref(0)
const hoverStar = ref(0)
const comentario = ref('')
const legalOk = ref(false)
const privacyUrl = ref('')

const errors = ref({
  nombre: '',
  calificacion: '',
  comentario: '',
  legalOk: ''
})

function validateForm() {
  errors.value = { nombre: '', calificacion: '', comentario: '', legalOk: '' }
  let valid = true

  if (!nombre.value.trim() || nombre.value.trim().length < 2) {
    errors.value.nombre = 'Ingresa tu nombre completo'
    valid = false
  }
  if (!calificacion.value || calificacion.value < 1) {
    errors.value.calificacion = 'Selecciona una calificación'
    valid = false
  }
  if (!comentario.value.trim() || comentario.value.trim().length < 5) {
    errors.value.comentario = 'Por favor escribe un comentario detallando tu experiencia'
    valid = false
  }
  if (!legalOk.value) {
    errors.value.legalOk = 'Debes aceptar los términos y el aviso de privacidad'
    valid = false
  }

  return valid
}

onMounted(async () => {
  try {
    const cleanToken = props.inviteToken.trim()
    const [tokenRes, configRes] = await Promise.all([
      supabase.from('tokens').select('*').eq('id_enlace', cleanToken).maybeSingle(),
      supabase.from('configuracion').select('clave, valor').eq('clave', 'Aviso_Privacidad_URL').maybeSingle()
    ])

    const token = tokenRes.data
    if (tokenRes.error || !token || token.estado !== 'Activo') {
      invalid.value = true
      return
    }

    tokenRecord.value = token
    nombre.value = token.nombre_cliente || ''
    zona.value = token.zona_servicio || ''
    privacyUrl.value = configRes.data?.valor?.trim() || ''
  } catch (e) {
    invalid.value = true
  } finally {
    loading.value = false
  }
})

async function enviar() {
  if (!validateForm()) return

  submitting.value = true
  errorMsg.value = ''
  try {
    const cleanToken = props.inviteToken.trim()
    const idResena = 'RES-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const userIdAsociado = tokenRecord.value?.user_id_admin || 'WEB'

    // 1. Insertar reseña
    const { error: revErr } = await supabase.from('resenas').insert({
      id_resena: idResena,
      user_id: userIdAsociado,
      fecha: new Date().toISOString().split('T')[0],
      cliente: nombre.value.trim(),
      servicio: zona.value.trim(),
      calificacion: calificacion.value,
      comentario: comentario.value.trim(),
      legal_ok: legalOk.value,
      estado: 'Pendiente'
    })

    if (revErr) throw revErr

    // 2. Inhabilitar token directamente por id_enlace
    await supabase
      .from('tokens')
      .update({ estado: 'Usado' })
      .eq('id_enlace', cleanToken)

    success.value = true
  } catch (e) {
    errorMsg.value = e.message || 'Error al enviar la reseña'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50 dark:bg-slate-900">
    <div v-if="loading" class="text-center">
      <div class="w-10 h-10 border-2 border-slate-200 border-t-brand rounded-full animate-spin mx-auto mb-3" />
      <p class="text-xs text-slate-500">Validando invitación...</p>
    </div>

    <div
      v-else-if="invalid"
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center"
    >
      <h1 class="text-lg font-medium text-slate-800 dark:text-white mb-2">Enlace no disponible</h1>
      <p class="text-slate-500 dark:text-slate-400 text-xs">
        Este enlace ya fue utilizado, ha expirado o no es válido.
      </p>
    </div>

    <div
      v-else-if="success"
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center"
    >
      <h1 class="text-lg font-medium text-slate-800 dark:text-white mb-2">Gracias por tu opinión</h1>
      <p class="text-slate-500 dark:text-slate-400 text-xs">
        Tu reseña se ha registrado con éxito y ha sido enviada al equipo de moderación.
      </p>
    </div>

    <form
      v-else
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-4"
      @submit.prevent="enviar"
      novalidate
    >
      <div class="text-center mb-2">
        <h1 class="text-lg font-medium text-slate-800 dark:text-white">Comparte tu experiencia</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ props.config?.nombre || 'Inmobiliarte 22' }}</p>
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
        <input
          v-model="nombre"
          type="text"
          class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-full outline-none text-base sm:text-xs text-slate-800 dark:text-white focus:border-brand"
          :class="errors.nombre ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'"
        />
        <p v-if="errors.nombre" class="text-rose-500 text-xs mt-1">{{ errors.nombre }}</p>
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Servicio recibido</label>
        <input
          v-model="zona"
          type="text"
          class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-full outline-none text-base sm:text-xs text-slate-800 dark:text-white focus:border-brand"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Calificación</label>
        <div class="flex items-center gap-1.5" @mouseleave="hoverStar = 0">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="text-2xl p-1 focus:outline-none transition-transform active:scale-110"
            @mouseenter="hoverStar = n"
            @click="calificacion = n"
          >
            <span :class="n <= (hoverStar || calificacion) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'">★</span>
          </button>
        </div>
        <p v-if="errors.calificacion" class="text-rose-500 text-xs mt-1">{{ errors.calificacion }}</p>
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Comentario <span class="text-rose-500">*</span>
        </label>
        <textarea
          v-model="comentario"
          rows="3"
          class="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl outline-none text-base sm:text-xs text-slate-800 dark:text-white resize-none focus:border-brand"
          :class="errors.comentario ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'"
          placeholder="Escribe aquí tu opinión detallada..."
        />
        <p v-if="errors.comentario" class="text-rose-500 text-xs mt-1">{{ errors.comentario }}</p>
      </div>

      <div>
        <label class="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
          <input v-model="legalOk" type="checkbox" class="mt-0.5 rounded border-slate-300 text-brand focus:ring-brand" />
          <span>
            Acepto el
            <a v-if="privacyUrl" :href="privacyUrl" target="_blank" class="text-brand underline">aviso de privacidad</a>
            <span v-else>aviso de privacidad</span>
            y autorizo la publicación.
          </span>
        </label>
        <p v-if="errors.legalOk" class="text-rose-500 text-xs mt-1">{{ errors.legalOk }}</p>
      </div>

      <p v-if="errorMsg" class="text-xs text-rose-500">{{ errorMsg }}</p>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full bg-brand text-white font-medium py-2.5 rounded-full shadow-sm hover:brightness-105 disabled:opacity-50 text-xs cursor-pointer"
      >
        {{ submitting ? 'Enviando...' : 'Enviar Reseña' }}
      </button>
    </form>
  </div>
</template>
