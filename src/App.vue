<script setup>
import { ref, onMounted } from 'vue'
import LoginView from './components/LoginView.vue'
import DashboardLayout from './components/DashboardLayout.vue'
import { apiClient } from './services/api'

const isAppLoading = ref(true)
const loadingMessage = ref('Estableciendo conexión') // Mensaje dinámico
const isAuthenticated = ref(false)
const appConfig = ref({ nombre: '', color: '#334155', logoH: null, logoV: null })

onMounted(async () => {
  if (localStorage.getItem('inm_dash_token')) {
    isAuthenticated.value = true
  }

  try {
    const configData = await apiClient.post('get_public_config')
    appConfig.value = {
      nombre: configData.nombre || 'Dashboard',
      color: configData.color || '#334155',
      logoH: configData.logoH,
      logoV: configData.logoV
    }
    document.documentElement.style.setProperty('--brand-color', appConfig.value.color)
  } catch (error) {
    console.error("Error de red:", error)
    appConfig.value.nombre = 'Sistema de Gestión'
  } finally {
    isAppLoading.value = false 
  }
})

// --- COREOGRAFÍA DE ENTRADA ---
function handleLoginSuccess(token) {
  // 1. Bajamos el telón
  loadingMessage.value = 'Iniciando sesión segura...'
  isAppLoading.value = true

  // 2. Cambiamos la escenografía tras bambalinas
  setTimeout(() => {
    localStorage.setItem('inm_dash_token', token)
    isAuthenticated.value = true
    
    // 3. Subimos el telón suavemente
    setTimeout(() => {
      isAppLoading.value = false
    }, 600)
  }, 300)
}

// --- COREOGRAFÍA DE SALIDA ---
function handleLogout() {
  // 1. Bajamos el telón
  loadingMessage.value = 'Cerrando sesión...'
  isAppLoading.value = true

  // 2. Limpiamos seguridad y recargamos limpiamente tras bambalinas
  setTimeout(() => {
    localStorage.removeItem('inm_dash_token')
    window.location.reload()
  }, 800) // Le damos tiempo al usuario de leer "Cerrando sesión..."
}
</script>

<template>
  <!-- EL TELÓN (Loader a pantalla completa) -->
  <Transition name="fade">
    <div v-if="isAppLoading" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 backdrop-blur-sm">
      <!-- Spinner con el color de la marca -->
      <div class="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-brand dark:border-t-brand rounded-full animate-spin mb-5 shadow-lg shadow-brand/20"></div>
      <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase animate-pulse">
        {{ loadingMessage }}
      </p>
    </div>
  </Transition>

  <!-- ESCENARIO -->
  <div v-show="!isAppLoading" class="min-h-screen w-full relative">
    <LoginView 
      v-if="!isAuthenticated" 
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
/* Transición mantecosa para el telón */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>