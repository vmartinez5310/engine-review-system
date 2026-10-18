<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { authState, hasPermission } from '../../composables/useAuth'

const props = defineProps({ config: Object })
const emit = defineEmits(['logout'])

const isSidebarOpen = ref(false)
const isMinified = ref(false)
const isDarkMode = ref(false)
const isUserMenuOpen = ref(false)
const isNotifMenuOpen = ref(false)

const activeTab = ref('inicio')

const DashboardHomeView = defineAsyncComponent(() => import('../../views/core/DashboardHomeView.vue'))
const ResenasView = defineAsyncComponent(() => import('../../views/core/ResenasView.vue'))
const UsuariosView = defineAsyncComponent(() => import('../../views/admin/UsuariosView.vue'))
const SistemaView = defineAsyncComponent(() => import('../../views/admin/SistemaView.vue'))
const PerfilView = defineAsyncComponent(() => import('../../views/user/PerfilView.vue'))
const DashboardHomeView = defineAsyncComponent(() => import('../../views/core/DashboardHomeView.vue'))

const currentViewComponent = computed(() => {
  const views = {
    inicio: DashboardHomeView,
    resenas: ResenasView,
    usuarios: UsuariosView,
    sistema: SistemaView,
    perfil: PerfilView
    'resenas': ResenasView,
    'usuarios': UsuariosView,
    'sistema': SistemaView,
    'perfil': PerfilView,
    'home': DashboardHomeView
  }
  return views[activeTab.value] || DashboardHomeView
})

const pageTitle = computed(() => {
  const titles = {
    inicio: 'Inicio',
    resenas: 'Centro de Reseñas',
    usuarios: 'Gestión de Usuarios',
    sistema: 'Configuración',
    perfil: 'Mi Perfil'
    'resenas': 'Centro de Reseñas',
    'usuarios': 'Gestión de Usuarios',
    'sistema': 'Configuración',
    'perfil': 'Mi Perfil',
    'home': 'Inicio'
  }
  return titles[activeTab.value] || 'Dashboard'
})

const currentUser = computed(() => authState.user || {})
const userRole = computed(() => currentUser.value.rol || 'USUARIO')
const userName = computed(() => {
  const nombre = currentUser.value.nombre || 'Usuario'
  return nombre.split(' ')[0]
})
const userInitials = computed(() => {
  const n = currentUser.value.nombre || 'U'
  return n.substring(0, 2).toUpperCase()
})

const notifications = computed(() => currentUser.value.notificaciones || { resenasNuevas: 0, seguimientosAtrasados: 0 })
const totalNotifications = computed(() => {
  return (notifications.value.resenasNuevas || 0) + (notifications.value.seguimientosAtrasados || 0)
})

function navigateTo(tab) {
  activeTab.value = tab
  isUserMenuOpen.value = false
  isNotifMenuOpen.value = false
  isSidebarOpen.value = false
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  const html = document.documentElement
  if (isDarkMode.value) {
    html.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    html.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

function logout() {
  emit('logout')
}

onMounted(() => {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      isSidebarOpen.value = false
      isUserMenuOpen.value = false
      isNotifMenuOpen.value = false
    }
  })
})
</script>

<template>
  <div class="h-screen flex w-full relative overflow-hidden text-slate-800 dark:text-slate-200 antialiased bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    <aside :class="[
        'fixed inset-y-0 left-0 bg-[#0F172A] border-r border-slate-800 z-50 transform md:relative transition-all duration-300 ease-in-out flex flex-col shrink-0',
        isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
        isMinified ? 'w-20' : 'w-64'
      ]">
      <button @click="isMinified = !isMinified"
        class="hidden md:flex absolute -right-3.5 top-8 w-7 h-7 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white shadow-md z-[60] transition-colors">
        <i :class="isMinified ? 'fas fa-chevron-right text-[10px]' : 'fas fa-chevron-left text-[10px]'"></i>
      </button>

      <div class="p-6 flex items-center h-20 shrink-0 overflow-hidden" :class="isMinified ? 'justify-center px-0' : 'justify-start'">
        <div v-if="isMinified" class="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand/20 shrink-0">
          <img v-if="config?.logoV" :src="config.logoV" class="w-full h-full object-contain p-1" />
          <span v-else class="text-xl drop-shadow-md">{{ config?.nombre?.charAt(0) || 'I' }}</span>
        </div>
        <div v-else class="flex items-center gap-3 w-full">
           <img v-if="config?.logoH" :src="config.logoH" class="h-8 object-contain max-w-[140px]" />
           <div v-else class="flex items-center gap-3">
              <div class="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                  <span class="drop-shadow-md">{{ config?.nombre?.charAt(0) || 'I' }}</span>
              </div>
              <h1 class="font-bold text-white text-lg tracking-tight truncate">{{ config?.nombre || 'Dashboard' }}</h1>
           </div>
        </div>
      </div>

      <nav class="flex-1 px-3 py-2 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
        <button @click="navigateTo('inicio')"
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'inicio' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-chart-pie text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Inicio</span></Transition>
          </div>
        </button>

        <button @click="navigateTo('resenas')"

        <!-- Ítem 1: Inicio -->
        <button @click="navigateTo('home')" 
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'home' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-home text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Inicio</span></Transition>
          </div>
        </button>
        
        <!-- Ítem 1: Reseñas -->
        <button @click="navigateTo('resenas')" 
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'resenas' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-star text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Reseñas</span></Transition>
          </div>
        </button>

        <button v-if="hasPermission('gestionar_usuarios')" @click="navigateTo('usuarios')"
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'usuarios' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-users text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Usuarios</span></Transition>
          </div>
        </button>

        <button v-if="hasPermission('configurar_sistema')" @click="navigateTo('sistema')"
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'sistema' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-cog text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Configuración</span></Transition>
          </div>
        </button>
      </nav>

      <div class="px-3 py-4 flex flex-col gap-1.5 border-t border-slate-800/50">
        <button @click="navigateTo('perfil')"
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'perfil' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-user-circle text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Mi Perfil</span></Transition>
          </div>
        </button>

        <button @click="logout"
          class="w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 group">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-sign-out-alt text-lg w-6 text-center group-hover:-translate-x-1 transition-transform"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Cerrar Sesión</span></Transition>
          </div>
        </button>
      </div>
    </aside>

    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"></div>

    <main class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden dark:bg-slate-900 transition-colors relative z-10">
      <header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 sticky top-0">
        <div class="flex items-center gap-3">
          <button @click="isSidebarOpen = !isSidebarOpen" class="md:hidden text-slate-500 hover:text-brand p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <i class="fas fa-bars text-xl"></i>
          </button>
          <span class="inline-block text-sm font-semibold text-slate-400 dark:text-slate-500 ml-2">
            Dashboard / <span class="text-slate-800 dark:text-slate-200">{{ pageTitle }}</span>
          </span>
        </div>

        <div class="flex items-center gap-3 sm:gap-4">
          <div class="relative flex items-center h-full">
            <button @click="isNotifMenuOpen = !isNotifMenuOpen; isUserMenuOpen = false" class="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-brand dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <i class="fas fa-bell text-[1.1rem]"></i>
              <span v-if="totalNotifications > 0" class="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </button>
            <div v-if="isNotifMenuOpen" @click="isNotifMenuOpen = false" class="fixed inset-0 z-40"></div>
            <div v-if="isNotifMenuOpen" class="absolute right-0 top-[calc(100%+12px)] w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div class="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                <h4 class="text-sm font-bold text-slate-800 dark:text-white">Notificaciones</h4>
                <span v-if="totalNotifications > 0" class="text-[10px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">{{ totalNotifications }}</span>
              </div>
              <div class="p-4 text-center text-sm text-slate-500" v-if="totalNotifications === 0">Sin notificaciones</div>
              <div v-else class="flex flex-col">
                <button v-if="notifications.resenasNuevas > 0" @click="navigateTo('resenas')" class="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 text-sm">
                  {{ notifications.resenasNuevas }} reseñas pendientes
                </button>
                <button v-if="notifications.seguimientosAtrasados > 0" @click="navigateTo('resenas')" class="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm">
                  {{ notifications.seguimientosAtrasados }} seguimientos atrasados
                </button>
              </div>
            </div>
          </div>

          <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div class="relative flex items-center h-full">
            <button @click="isUserMenuOpen = !isUserMenuOpen; isNotifMenuOpen = false" class="flex items-center gap-3 pl-2 py-1 pr-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div class="hidden sm:flex flex-col items-end">
                <span class="text-sm font-bold text-slate-800 dark:text-white leading-tight">{{ userName }}</span>
                <span class="text-[10px] font-semibold text-brand uppercase tracking-wider">{{ userRole }}</span>
              </div>
              <div class="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shadow-md uppercase overflow-hidden">
                <img v-if="currentUser.logo" :src="currentUser.logo" class="w-full h-full object-cover" @error="$event.target.style.display='none'" />
                <template v-else>{{ userInitials }}</template>
              </div>
            </button>
            <div v-if="isUserMenuOpen" @click="isUserMenuOpen = false" class="fixed inset-0 z-40"></div>
            <div v-if="isUserMenuOpen" class="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                <p class="text-sm font-bold text-slate-800 dark:text-white truncate">{{ currentUser.nombre }}</p>
                <p class="text-xs text-slate-500 truncate mt-0.5">{{ currentUser.email }}</p>
              </div>
              <div class="p-2">
                <button @click="navigateTo('perfil')" class="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl">Mi Perfil</button>
                <button @click="toggleTheme" class="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl">Modo Oscuro</button>
                <button @click="logout" class="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl">Cerrar sesión</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-hidden p-3 sm:p-5">
        <component :is="currentViewComponent" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-sidebar-enter-active, .fade-sidebar-leave-active { transition: opacity 0.15s ease; }
.fade-sidebar-enter-from, .fade-sidebar-leave-to { opacity: 0; }
</style>
