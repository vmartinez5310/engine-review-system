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

const canSubmit = computed(() =>
  nombre.value.trim().length >= 2 &&
  calificacion.value >= 1 &&
  legalOk.value &&
  !submitting.value
)

onMounted(async () => {
  try {
    const cleanToken = props.inviteToken.trim()

    // 1. Cargar el token y la URL del aviso de privacidad en paralelo
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
  if (!canSubmit.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    const idResena = 'RES-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const userIdAsociado = tokenRecord.value?.user_id_admin || 'WEB'

    // 1. Insertar la reseña
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

    // 2. Quemar el token explícitamente usando su id_enlace (además del trigger de base de datos)
    if (tokenRecord.value?.id_enlace) {
      await supabase
        .from('tokens')
        .update({ estado: 'Usado' })
        .eq('id_enlace', tokenRecord.value.id_enlace)
    }

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
      <div class="w-12 h-12 border-4 border-slate-200 border-t-brand rounded-full animate-spin mx-auto mb-4" />
      <p class="text-sm text-slate-500 tracking-wide uppercase">Validando invitación...</p>
    </div>

    <div
      v-else-if="invalid"
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center"
    >
      <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-link-slash text-xl" />
      </div>
      <h1 class="text-xl font-bold text-slate-800 dark:text-white mb-2">Enlace no disponible</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Este enlace ya fue utilizado, ha expirado o no es válido.
      </p>
    </div>

    <div
      v-else-if="success"
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center"
    >
      <div class="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-xl" />
      </div>
      <h1 class="text-xl font-bold text-slate-800 dark:text-white mb-2">¡Muchas gracias!</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm">
        Tu reseña se ha registrado con éxito.
      </p>
    </div>

    <form
      v-else
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-5"
      @submit.prevent="enviar"
    >
      <div class="text-center mb-2">
        <h1 class="text-xl font-bold text-slate-800 dark:text-white">Comparte tu experiencia</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ props.config?.nombre || 'Inmobiliarte 22' }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nombre público</label>
        <input
          v-model="nombre"
          type="text"
          required
          minlength="2"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white text-base sm:text-sm"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Servicio recibido</label>
        <input
          v-model="zona"
          type="text"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white text-base sm:text-sm"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Calificación</label>
        <div class="flex items-center gap-2" @mouseleave="hoverStar = 0">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="text-3xl p-1 focus:outline-none transition-transform active:scale-110"
            @mouseenter="hoverStar = n"
            @click="calificacion = n"
          >
            <i class="fas fa-star" :class="n <= (hoverStar || calificacion) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'" />
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Comentario</label>
        <textarea
          v-model="comentario"
          rows="4"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white text-base sm:text-sm resize-none"
          placeholder="Cuéntanos sobre el servicio recibido..."
        />
      </div>

      <label class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
        <input v-model="legalOk" type="checkbox" class="mt-1 w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand shrink-0" required />
        <span class="text-xs sm:text-sm leading-relaxed">
          Acepto el
          <a
            v-if="privacyUrl"
            :href="privacyUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-brand font-semibold underline hover:brightness-110"
            @click.stop
          >
            aviso de privacidad
          </a>
          <span v-else class="font-semibold text-slate-700 dark:text-slate-200">aviso de privacidad</span>
          y autorizo la publicación de mi reseña.
        </span>
      </label>

      <p v-if="errorMsg" class="text-sm text-red-500 font-medium">{{ errorMsg }}</p>

      <button
        type="submit"
        :disabled="!canSubmit"
        class="w-full bg-brand hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-base"
      >
        <span>{{ submitting ? 'Enviando...' : 'Enviar Reseña' }}</span>
      </button>
    </form>
  </div>
</template>
