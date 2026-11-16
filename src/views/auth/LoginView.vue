<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { fetchUserInfo } from '../../composables/useAuth'

const props = defineProps({ config: Object })
const emit = defineEmits(['login-success'])

const step = ref('EMAIL')
const email = ref('')
const otp = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

onMounted(() => {
  const isDark = localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
})

async function solicitarAcceso() {
  const cleanEmail = email.value.toLowerCase().trim()
  if (!cleanEmail.includes('@')) {
    errorMsg.value = 'Ingresa un formato de correo válido'
    return
  }

  isLoading.value = true
  errorMsg.value = ''
  try {
    const { data: check, error: rpcError } = await supabase.rpc('check_email_authorized', {
      user_email: cleanEmail
    })

    if (rpcError) {
      console.error('Error RPC check_email_authorized:', rpcError)
      throw new Error('No se pudo verificar la autorización del correo.')
    }

    if (!check?.authorized) {
      if (check?.reason === 'suspended') {
        throw new Error('Esta cuenta ha sido suspendida. Contacta a un administrador.')
      }
      throw new Error('El correo ingresado no está registrado en la lista de acceso.')
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true }
    })

    if (otpError) throw otpError
    step.value = 'OTP'
  } catch (e) {
    errorMsg.value = e.message || 'Error al enviar el código de verificación'
  } finally {
    isLoading.value = false
  }
}

async function verificarCodigo() {
  const tokenLimpio = otp.value.trim()
  if (tokenLimpio.length < 6) {
    errorMsg.value = 'Ingresa el código completo recibido'
    return
  }

  isLoading.value = true
  errorMsg.value = ''
  try {
    const cleanEmail = email.value.toLowerCase().trim()
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: tokenLimpio,
      type: 'email'
    })

    if (verifyError) throw verifyError

    const sincronizado = await fetchUserInfo()
    if (!sincronizado) {
      throw new Error('Sesión creada, pero el correo no coincide con un registro activo en la whitelist.')
    }

    emit('login-success', data.session?.access_token)
  } catch (e) {
    errorMsg.value = e.message || 'Código inválido o expirado'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative z-50 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand/10 dark:bg-brand/20 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

    <div class="max-w-md w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700/50 p-8 sm:p-10 relative z-10 transition-colors">
      <div class="text-center mb-8">
        <div v-if="config?.logoV" class="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-6 border border-slate-100 dark:border-slate-700 p-2">
          <img :src="config.logoV" class="w-full h-full object-contain" alt="Logo" />
        </div>
        <img v-else-if="config?.logoH" :src="config.logoH" class="h-12 mx-auto mb-6 object-contain" alt="Logo" />
        <div v-else class="w-16 h-16 bg-brand rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-brand/20 mb-6 text-white font-bold text-2xl">
          {{ config?.nombre?.charAt(0) || 'D' }}
        </div>
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Acceso al sistema</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1"> {{ config?.nombre || 'Dashboard' }} </p>
      </div>

      <form v-if="step === 'EMAIL'" @submit.prevent="solicitarAcceso" class="space-y-5" novalidate>
        <div>
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Correo electrónico</label>
          <input
            v-model="email"
            type="email"
            class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-slate-800 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="usuario@dominio.com"
            required
          />
        </div>
        <Transition name="fade">
          <p v-if="errorMsg" class="text-red-500 text-sm font-medium"> {{ errorMsg }} </p>
        </Transition>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-brand hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-brand/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin" />
          <span>{{ isLoading ? 'Procesando...' : 'Enviar Código' }}</span>
        </button>
      </form>

      <form v-if="step === 'OTP'" @submit.prevent="verificarCodigo" class="space-y-5">
        <p class="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
          Ingresa el código que enviamos a<br />
          <strong class="text-slate-800 dark:text-white"> {{ email }} </strong>
        </p>
        <input
          v-model="otp"
          type="text"
          maxlength="8"
          class="w-full py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-3xl tracking-[0.25em] focus:ring-2 focus:ring-brand outline-none font-mono font-bold text-slate-800 dark:text-white transition-all"
          placeholder="••••••••"
          required
        />
        <Transition name="fade">
          <p v-if="errorMsg" class="text-red-500 text-sm font-medium text-center"> {{ errorMsg }} </p>
        </Transition>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-slate-800 hover:bg-slate-900 dark:bg-brand dark:hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin" />
          <span>{{ isLoading ? 'Verificando...' : 'Validar Acceso' }}</span>
        </button>
        <button
          type="button"
          class="w-full text-center text-sm font-medium text-slate-500 hover:text-brand transition-colors mt-2 cursor-pointer"
          @click="step = 'EMAIL'; otp = ''"
        >
          <i class="fas fa-arrow-left mr-1" /> Modificar correo
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
