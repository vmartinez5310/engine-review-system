<script setup>
import { ref, reactive, nextTick, onMounted, computed } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { fetchUserInfo } from '../../composables/useAuth'

const props = defineProps({ config: Object })
const emit = defineEmits(['login-success'])

const step = ref('EMAIL')
const email = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

const digits = reactive(['', '', '', '', '', ''])
const inputRefs = ref([])

const fullOtp = computed(() => digits.join(''))
const isOtpComplete = computed(() => digits.every(d => d !== ''))

onMounted(() => {
  const isDark = localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
})

async function solicitarAcceso() {
  const cleanEmail = email.value.toLowerCase().trim()
  if (!cleanEmail.includes('@')) {
    errorMsg.value = 'Ingresa un correo electrónico válido'
    return
  }

  isLoading.value = true
  errorMsg.value = ''
  try {
    const { data: check, error: rpcError } = await supabase.rpc('check_email_authorized', {
      user_email: cleanEmail
    })

    if (rpcError || !check?.authorized) {
      if (check?.reason === 'suspended') {
        throw new Error('Esta cuenta ha sido suspendida.')
      }
      throw new Error('El correo ingresado no está registrado.')
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true }
    })

    if (otpError) throw otpError

    for (let i = 0; i < 6; i++) digits[i] = ''
    step.value = 'OTP'
    await nextTick()
    inputRefs.value[0]?.focus()
  } catch (e) {
    errorMsg.value = e.message || 'Error al enviar el código de verificación'
  } finally {
    isLoading.value = false
  }
}

function handleInput(index, event) {
  const value = event.target.value.replace(/\D/g, '')
  if (!value) {
    digits[index] = ''
    return
  }
  digits[index] = value.slice(-1)

  if (index < 5) {
    nextTick(() => inputRefs.value[index + 1]?.focus())
  } else if (isOtpComplete.value) {
    verificarCodigo()
  }
}

function handleKeyDown(index, event) {
  if (event.key === 'Backspace' && !digits[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

function handlePaste(event) {
  event.preventDefault()
  const pastedData = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6)
  if (!pastedData) return

  for (let i = 0; i < 6; i++) {
    digits[i] = pastedData[i] || ''
  }

  const nextEmpty = digits.findIndex(d => d === '')
  if (nextEmpty !== -1) {
    inputRefs.value[nextEmpty]?.focus()
  } else {
    inputRefs.value[5]?.focus()
    verificarCodigo()
  }
}

async function verificarCodigo() {
  const tokenLimpio = fullOtp.value.trim()
  if (tokenLimpio.length !== 6) {
    errorMsg.value = 'Ingresa los 6 dígitos del código'
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
      throw new Error('No se pudo cargar el perfil institucional.')
    }

    emit('login-success', data.session?.access_token)
  } catch (e) {
    errorMsg.value = e.message || 'Código inválido o expirado'
  } finally {
    isLoading.value = false
  }
}

function regresarAEmail() {
  step.value = 'EMAIL'
  errorMsg.value = ''
  for (let i = 0; i < 6; i++) digits[i] = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative z-50 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    <div class="max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/60 p-6 sm:p-8 relative z-10">
      <div class="text-center mb-6">
        <img v-if="config?.logoH || config?.logoV" :src="config.logoH || config.logoV" class="h-8 mx-auto mb-4 object-contain" alt="Logo" />
        <h2 class="text-xl font-medium text-slate-800 dark:text-white tracking-tight">Acceso</h2>
        <p class="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{{ config?.nombre || 'Engine Review' }}</p>
      </div>

      <!-- novalidate elimina tooltips nativos del navegador -->
      <form v-if="step === 'EMAIL'" @submit.prevent="solicitarAcceso" class="space-y-4" novalidate>
        <div>
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Correo electrónico</label>
          <input
            v-model="email"
            type="email"
            class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-full focus:border-brand outline-none text-base sm:text-xs text-slate-800 dark:text-white"
            placeholder="usuario@dominio.com"
          />
        </div>
        <p v-if="errorMsg" class="text-rose-500 text-xs">{{ errorMsg }}</p>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-brand text-white font-medium py-2.5 rounded-full shadow-sm hover:brightness-105 disabled:opacity-50 text-xs cursor-pointer"
        >
          {{ isLoading ? 'Procesando...' : 'Enviar Código' }}
        </button>
      </form>

      <form v-if="step === 'OTP'" @submit.prevent="verificarCodigo" class="space-y-5" novalidate>
        <p class="text-xs text-slate-500 dark:text-slate-400 text-center">
          Ingresa el código enviado a<br />
          <strong class="text-slate-800 dark:text-white">{{ email }}</strong>
        </p>

        <div class="flex items-center justify-center gap-2" @paste="handlePaste">
          <input
            v-for="(digit, i) in digits"
            :key="i"
            :ref="el => { if (el) inputRefs[i] = el }"
            v-model="digits[i]"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
            class="w-10 h-12 text-center text-xl font-bold bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-brand text-slate-900 dark:text-white"
            @input="handleInput(i, $event)"
            @keydown="handleKeyDown(i, $event)"
          />
        </div>

        <p v-if="errorMsg" class="text-rose-500 text-xs text-center">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="isLoading || !isOtpComplete"
          class="w-full bg-brand text-white font-medium py-2.5 rounded-full shadow-sm hover:brightness-105 disabled:opacity-50 text-xs cursor-pointer"
        >
          {{ isLoading ? 'Verificando...' : 'Validar Acceso' }}
        </button>

        <button
          type="button"
          class="w-full text-center text-xs text-slate-400 hover:text-brand cursor-pointer"
          @click="regresarAEmail"
        >
          Modificar correo
        </button>
      </form>
    </div>
  </div>
</template>
