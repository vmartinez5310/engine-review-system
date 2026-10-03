<script setup>
import { ref, onMounted } from 'vue'
import LoginView from './components/LoginView.vue'
import DashboardLayout from './components/DashboardLayout.vue'
import { apiClient } from './services/api'
import { authState, fetchUserInfo, logout as authLogout } from './composables/useAuth'

const isAppLoading = ref(true)
const loadingMessage = ref('Estableciendo conexión')
const appConfig = ref({ nombre: '', color: '#334155', logoH: null, logoV: null })

onMounted(async () => {
  try {
    const configData = await apiClient.post('get_public_config')
    appConfig.value = {
      nombre: configData.nombre || 'Dashboard',
      color: configData.color || '#334155',
      logoH: configData.logoH,
      logoV: configData.logoV
    }
    document.documentElement.style.setProperty('--brand-color', appConfig.value.color)

    await fetchUserInfo()
  } catch (error) {
    console.error(error)
    appConfig.value.nombre = 'Sistema de Gestión'
  } finally {
    isAppLoading.value = false 
  }
})

async function handleLoginSuccess(token) {
  loadingMessage.value = 'Iniciando sesión segura...'
  isAppLoading.value = true

  localStorage.setItem('inm_dash_token', token)
  
  const success = await fetchUserInfo(token)
  
  if (success) {
    setTimeout(() => {
      isAppLoading.value = false
    }, 600)
  } else {
    isAppLoading.value = false
    window.Swal?.fire('Error', 'No se pudo iniciar sesión. Verifica tu conexión.', 'error') || alert("Error al iniciar sesión segura")
  }
}

function handleLogout() {
  loadingMessage.value = 'Cerrando sesión...'
  isAppLoading.value = true

  setTimeout(() => {
    authLogout()
  }, 800) 
}
</script>

<template>
  <Transition name="fade">
    <div v-if="isAppLoading" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 backdrop-blur-sm">
      <div class="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-brand dark:border-t-brand rounded-full animate-spin mb-5 shadow-lg shadow-brand/20"></div>
      <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase animate-pulse">
        {{ loadingMessage }}
      </p>
    </div>
  </Transition>

  <div v-show="!isAppLoading" class="min-h-screen w-full relative">
    <LoginView 
      v-if="!authState.isAuthenticated" 
      :config="appConfig" 
      @login-success="handleLoginSuccess" 
    />
    <DashboardLayout 
      v-else 
      :config="appConfig" 
      @logout="handleLogout" 
    />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>