<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../../services/api'

const props = defineProps({ config: Object })
const emit = defineEmits(['login-success'])

const step = ref('EMAIL')
const email = ref('')
const otp = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

// Detección de tema del sistema al montar la vista de Login
onMounted(() => {
  const isDark = localStorage.getItem('theme') === 'dark' || 
                 (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})

async function solicitarAcceso() {
  if(!email.value.includes('@')) { errorMsg.value = 'Ingresa un formato válido'; return }
  isLoading.value = true
  errorMsg.value = ''
  
  try {
    await apiClient.post('request_otp', { email: email.value })
    step.value = 'OTP'
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    isLoading.value = false
  }
}

async function verificarCodigo() {
  if(otp.value.length !== 6) { errorMsg.value = 'El código debe tener 6 dígitos'; return }
  isLoading.value = true
  errorMsg.value = ''
  
  try {
    const { token } = await apiClient.post('verify_otp', { email: email.value, otp: otp.value })
    emit('login-success', token)
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- Fondo dinámico que reacciona al sistema. Sin degradados pesados, solo un suave desenfoque -->
  <div class="min-h-screen flex items-center justify-center px-4 relative z-50 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    
    <!-- Elementos decorativos de fondo (suaves) -->
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand/10 dark:bg-brand/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Contenedor Principal (Tarjeta) -->
    <div class="max-w-md w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700/50 p-8 sm:p-10 relative z-10 transition-colors">
      
      <!-- Encabezado y Logo Dinámico -->
      <div class="text-center mb-8">
        <!-- Lógica de Logo: Vertical -> Horizontal -> Inicial -->
        <div v-if="config?.logoV" class="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-6 border border-slate-100 dark:border-slate-700 p-2">
          <img :src="config.logoV" class="w-full h-full object-contain" alt="Logo" />
        </div>
        <img v-else-if="config?.logoH" :src="config.logoH" class="h-12 mx-auto mb-6 object-contain" alt="Logo" />
        <div v-else class="w-16 h-16 bg-brand rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-brand/20 mb-6 text-white font-bold text-2xl">
          {{ config?.nombre?.charAt(0) || 'D' }}
        </div>
        
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Acceso al sistema</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ config?.nombre || 'Cargando información...' }}</p>
      </div>

      <!-- Paso 1: Correo -->
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
        <Transition name="fade"><p v-if="errorMsg" class="text-red-500 text-sm font-medium">{{ errorMsg }}</p></Transition>
        
        <!-- Botón limpio sin degradados agresivos -->
        <button type="submit" :disabled="isLoading" class="w-full bg-brand hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-brand/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
          <span>{{ isLoading ? 'Procesando...' : 'Continuar' }}</span>
        </button>
      </form>

      <!-- Paso 2: OTP -->
      <form v-if="step === 'OTP'" @submit.prevent="verificarCodigo" class="space-y-5">
        <p class="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
          Ingresa el código de 6 dígitos que enviamos a <br/>
          <strong class="text-slate-800 dark:text-white">{{ email }}</strong>
        </p>
        
        <input 
          v-model="otp" 
          type="text" 
          maxlength="6" 
          class="w-full py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-3xl tracking-[0.5em] focus:ring-2 focus:ring-brand outline-none font-mono font-bold text-slate-800 dark:text-white transition-all" 
          placeholder="••••••" 
          required 
        />
        
        <Transition name="fade"><p v-if="errorMsg" class="text-red-500 text-sm font-medium text-center">{{ errorMsg }}</p></Transition>
        
        <button type="submit" :disabled="isLoading" class="w-full bg-slate-800 hover:bg-slate-900 dark:bg-brand dark:hover:brightness-110 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
          <span>{{ isLoading ? 'Verificando...' : 'Validar acceso' }}</span>
        </button>

        <button @click="step = 'EMAIL'; otp = ''" type="button" class="w-full text-center text-sm font-medium text-slate-500 hover:text-brand transition-colors mt-2">
          <i class="fas fa-arrow-left mr-1"></i> Modificar correo
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>