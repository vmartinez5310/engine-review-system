<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '../../services/api'

const props = defineProps({
  inviteToken: { type: String, required: true },
  config: { type: Object, default: () => ({}) }
})

const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref('')
const success = ref(false)
const invalid = ref(false)
const redirectUrl = ref('')

const tokenId = ref('')
const nombre = ref('')
const zona = ref('')
const calificacion = ref(0)
const hoverStar = ref(0)
const comentario = ref('')
const legalOk = ref(false)
const recaptchaSiteKey = ref('')

const canSubmit = computed(() =>
  nombre.value.trim().length >= 2 &&
  calificacion.value >= 1 &&
  legalOk.value &&
  !submitting.value
)

onMounted(async () => {
  try {
    const data = await apiClient.post('validate_review_token', { token: props.inviteToken })
    if (!data?.valid) {
      invalid.value = true
      redirectUrl.value = data?.redirectUrl || props.config?.urlFrontend || '/'
      setTimeout(() => {
        if (redirectUrl.value) window.location.replace(redirectUrl.value)
      }, 2500)
      return
    }
    tokenId.value = data.token_id
    nombre.value = data.nombre_cliente || ''
    zona.value = data.zona_servicio || ''
    recaptchaSiteKey.value = data.brand?.recaptchaSiteKey || props.config?.recaptchaSiteKey || ''
    if (data.brand?.color) {
      document.documentElement.style.setProperty('--brand-color', data.brand.color)
    }
  } catch (e) {
    invalid.value = true
    errorMsg.value = e.message || 'Enlace no válido'
    redirectUrl.value = props.config?.urlFrontend || '/'
  } finally {
    loading.value = false
  }
})

function waitForEnterprise(maxMs = 8000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      const ent = window.grecaptcha?.enterprise
      if (ent) {
        ent.ready(() => resolve(ent))
        return
      }
      if (Date.now() - start >= maxMs) {
        resolve(null)
        return
      }
      setTimeout(tick, 150)
    }
    tick()
  })
}

async function getRecaptchaToken() {
  const siteKey = recaptchaSiteKey.value
  if (!siteKey) {
    console.warn('[reCAPTCHA] site key empty')
    return ''
  }

  let enterprise = window.grecaptcha?.enterprise
  if (!enterprise) {
    // Script may still be loading (App.vue injects it)
    enterprise = await waitForEnterprise(8000)
  }
  if (!enterprise) {
    console.warn('[reCAPTCHA] grecaptcha.enterprise not available (blocked script or domain)')
    return ''
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[reCAPTCHA] execute timeout')
      resolve('')
    }, 10000)
    try {
      enterprise.ready(() => {
        enterprise
          .execute(siteKey, { action: 'submit' })
          .then((token) => {
            clearTimeout(timeout)
            resolve(token || '')
          })
          .catch((err) => {
            clearTimeout(timeout)
            console.warn('[reCAPTCHA] execute error', err)
            resolve('')
          })
      })
    } catch (err) {
      clearTimeout(timeout)
      console.warn('[reCAPTCHA] ready error', err)
      resolve('')
    }
  })
}

async function enviar() {
  if (!canSubmit.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    const recaptcha_token = await getRecaptchaToken()
    if (!recaptcha_token) {
      const hasKey = !!recaptchaSiteKey.value
      const hasLib = !!window.grecaptcha?.enterprise
      errorMsg.value = !hasKey
        ? 'reCAPTCHA no configurado (falta RECAPTCHA_SITE_KEY en Script Properties).'
        : !hasLib
          ? 'No se pudo cargar reCAPTCHA. Desactiva bloqueadores / revisa dominios en Google Cloud (vmartinez5310.github.io + localhost).'
          : 'No se pudo verificar seguridad (reCAPTCHA). Desactiva bloqueadores e intenta de nuevo.'
      return
    }
    await apiClient.post('submit_review', {
      token_id: tokenId.value,
      nombre_publico: nombre.value.trim(),
      zona_propiedad: zona.value.trim(),
      calificacion: calificacion.value,
      valor_gestion_resena: comentario.value.trim(),
      aviso_privacidad_aceptado: legalOk.value,
      recaptcha_token
    })
    success.value = true
  } catch (e) {
    errorMsg.value = e.message || 'No se pudo enviar la reseña'
  } finally {
    submitting.value = false
  }
}

function starClass(n) {
  const active = hoverStar.value || calificacion.value
  return n <= active ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-50 dark:bg-slate-900">
    <div v-if="loading" class="text-center">
      <div class="w-12 h-12 border-4 border-slate-200 border-t-brand rounded-full animate-spin mx-auto mb-4" />
      <p class="text-sm text-slate-500 tracking-wide uppercase">Validando enlace…</p>
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
        Este enlace ya fue usado, expiró o no es válido. Serás redirigido en unos segundos.
      </p>
      <a
        v-if="redirectUrl"
        :href="redirectUrl"
        class="inline-flex items-center gap-2 text-brand font-semibold text-sm hover:underline"
      >
        Ir al inicio <i class="fas fa-arrow-right text-xs" />
      </a>
    </div>

    <div
      v-else-if="success"
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center"
    >
      <div class="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-xl" />
      </div>
      <h1 class="text-xl font-bold text-slate-800 dark:text-white mb-2">¡Gracias por tu reseña!</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm">
        Tu opinión nos ayuda a mejorar. Pronto será publicada.
      </p>
    </div>

    <form
      v-else
      class="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-5"
      @submit.prevent="enviar"
    >
      <div class="text-center mb-2">
        <img
          v-if="props.config?.logoV || props.config?.logoH"
          :src="props.config.logoV || props.config.logoH"
          alt="Logo"
          class="h-12 mx-auto mb-3 object-contain"
        />
        <h1 class="text-xl font-bold text-slate-800 dark:text-white">Comparte tu experiencia</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ props.config?.nombre || 'Inmobiliarte' }}</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tu nombre público</label>
        <input
          v-model="nombre"
          type="text"
          required
          minlength="2"
          maxlength="80"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white"
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Servicio / zona</label>
        <input
          v-model="zona"
          type="text"
          maxlength="100"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white"
          placeholder="Opcional"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Calificación</label>
        <div class="flex items-center gap-2" @mouseleave="hoverStar = 0">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="text-2xl transition-colors p-1"
            @mouseenter="hoverStar = n"
            @click="calificacion = n"
          >
            <i class="fas fa-star" :class="starClass(n)" />
          </button>
          <span class="text-sm text-slate-500 ml-2">{{ calificacion || '—' }} / 5</span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tu experiencia</label>
        <textarea
          v-model="comentario"
          rows="4"
          maxlength="2000"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white resize-none"
          placeholder="Cuéntanos cómo te fue…"
        />
      </div>

      <label class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
        <input v-model="legalOk" type="checkbox" class="mt-1 rounded border-slate-300 text-brand focus:ring-brand" required />
        <span>Acepto el aviso de privacidad y autorizo la publicación de esta reseña.</span>
      </label>

      <p v-if="errorMsg" class="text-sm text-red-500 font-medium">{{ errorMsg }}</p>

      <button
        type="submit"
        :disabled="!canSubmit"
        class="w-full bg-brand hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-brand/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <i v-if="submitting" class="fas fa-spinner fa-spin" />
        <span>{{ submitting ? 'Enviando…' : 'Enviar reseña' }}</span>
      </button>
    </form>
  </div>
</template>
