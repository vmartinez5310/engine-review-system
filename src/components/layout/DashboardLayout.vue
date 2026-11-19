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

const activeTab = ref('home')
const subTabToOpen = ref(null)

const DashboardHomeView = defineAsyncComponent(() => import('../../views/core/DashboardHomeView.vue'))
const ResenasView = defineAsyncComponent(() => import('../../views/core/ResenasView.vue'))
const UsuariosView = defineAsyncComponent(() => import('../../views/admin/UsuariosView.vue'))
const SistemaView = defineAsyncComponent(() => import('../../views/admin/SistemaView.vue'))
const PerfilView = defineAsyncComponent(() => import('../../views/user/PerfilView.vue'))

const currentViewComponent = computed(() => {
  const views = {
    home: DashboardHomeView,
    resenas: ResenasView,
    usuarios: UsuariosView,
    sistema: SistemaView,
    perfil: PerfilView
  }
  return views[activeTab.value] || DashboardHomeView
})

const pageTitle = computed(() => {
  const titles = {
    home: 'Resumen Ejecutivo',
    resenas: 'Centro de Reseñas',
    usuarios: 'Gestión de Operadores',
    sistema: 'Parámetros del Sistema',
    perfil: 'Perfil del Operador'
  }
  return titles[activeTab.value] || 'Panel'
})

const currentUser = computed(() => authState.user || {})
const userRole = computed(() => currentUser.value.rol || 'USUARIO')
const userName = computed(() => {
  const nombre = currentUser.value.nombre || 'Operador'
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

function navigateTo(tab, subTab = null) {
  activeTab.value = tab
  subTabToOpen.value = subTab
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
  <div class="h-screen flex w-full relative overflow-hidden text-slate-800 dark:text-slate-200 antialiased bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
    <!-- Sidebar Arquitectónico Minimalista -->
    <aside :class="[
      'fixed inset-y-0 left-0 bg-white/70 dark:bg-[#0B1120]/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/50 z-50 transform md:relative transition-all duration-300 ease-in-out flex flex-col shrink-0',
      isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
      isMinified ? 'w-16' : 'w-60'
    ]">
      <button
        @click="isMinified = !isMinified"
        class="hidden md:flex absolute -right-3 top-7 w-6 h-6 bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-700/60 rounded-full items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white shadow-sm z-[60] transition-colors cursor-pointer"
        aria-label="Minificar menú"
      >
        <svg class="w-3 h-3 transform transition-transform" :class="isMinified ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <!-- Logo / Marca sobre fondo neutro protegido -->
      <div class="h-16 px-5 flex items-center border-b border-slate-100 dark:border-slate-800/40 shrink-0 overflow-hidden" :class="isMinified ? 'justify-center px-0' : 'justify-start'">
        <div v-if="isMinified" class="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden shrink-0">
          <img v-if="config?.logoV" :src="config.logoV" class="w-full h-full object-contain" />
          <span v-else class="text-xs font-mono font-medium text-slate-900 dark:text-white">{{ config?.nombre?.charAt(0) || 'E' }}</span>
        </div>
        <div v-else class="flex items-center gap-3 w-full">
          <img v-if="config?.logoH" :src="config.logoH" class="h-6 object-contain max-w-[140px]" />
          <div v-else class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full bg-brand"></span>
            <h1 class="font-light text-slate-900 dark:text-white text-sm tracking-wide truncate">{{ config?.nombre || 'Engine Review' }}</h1>
          </div>
        </div>
      </div>

      <!-- Navegación SVG Lineal -->
      <nav class="flex-1 px-2.5 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        <button
          @click="navigateTo('home')"
          :class="[
            'w-full h-10 flex items-center px-3 rounded-lg transition-all text-xs font-medium cursor-pointer',
            activeTab === 'home'
              ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40'
          ]"
        >
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0" :class="activeTab === 'home' ? 'text-brand' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span v-show="!isMinified" class="ml-3 truncate tracking-wide">Inicio</span>
          </div>
        </button>

        <button
          @click="navigateTo('resenas')"
          :class="[
            'w-full h-10 flex items-center px-3 rounded-lg transition-all text-xs font-medium cursor-pointer',
            activeTab === 'resenas'
              ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40'
          ]"
        >
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0" :class="activeTab === 'resenas' ? 'text-brand' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span v-show="!isMinified" class="ml-3 truncate tracking-wide">Reseñas</span>
          </div>
        </button>

        <button
          v-if="hasPermission('gestionar_usuarios')"
          @click="navigateTo('usuarios')"
          :class="[
            'w-full h-10 flex items-center px-3 rounded-lg transition-all text-xs font-medium cursor-pointer',
            activeTab === 'usuarios'
              ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40'
          ]"
        >
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0" :class="activeTab === 'usuarios' ? 'text-brand' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span v-show="!isMinified" class="ml-3 truncate tracking-wide">Usuarios</span>
          </div>
        </button>

        <button
          v-if="hasPermission('configurar_sistema')"
          @click="navigateTo('sistema')"
          :class="[
            'w-full h-10 flex items-center px-3 rounded-lg transition-all text-xs font-medium cursor-pointer',
            activeTab === 'sistema'
              ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40'
          ]"
        >
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0" :class="activeTab === 'sistema' ? 'text-brand' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span v-show="!isMinified" class="ml-3 truncate tracking-wide">Configuración</span>
          </div>
        </button>
      </nav>

      <div class="px-2.5 py-3 flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800/40">
        <button
          @click="navigateTo('perfil')"
          :class="[
            'w-full h-10 flex items-center px-3 rounded-lg transition-all text-xs font-medium cursor-pointer',
            activeTab === 'perfil'
              ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40'
          ]"
        >
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span v-show="!isMinified" class="ml-3 truncate tracking-wide">Mi Perfil</span>
          </div>
        </button>

        <button
          @click="logout"
          class="w-full h-10 flex items-center px-3 rounded-lg transition-all text-xs font-medium text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
        >
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span v-show="!isMinified" class="ml-3 truncate tracking-wide">Desconectar</span>
          </div>
        </button>
      </div>
    </aside>

    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-slate-950/40 dark:bg-black/60 z-40 md:hidden backdrop-blur-sm"></div>

    <!-- Contenido Principal Header Fino -->
    <main class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
      <header class="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/50 h-16 px-4 sm:px-8 flex items-center justify-between shrink-0 z-30 sticky top-0">
        <div class="flex items-center gap-3">
          <button @click="isSidebarOpen = !isSidebarOpen" class="md:hidden text-slate-500 p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400">Terminal</span>
            <span class="text-slate-300 dark:text-slate-700">/</span>
            <span class="text-xs font-normal tracking-wide text-slate-800 dark:text-slate-200">{{ pageTitle }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Notificaciones -->
          <div class="relative flex items-center">
            <button
              @click="isNotifMenuOpen = !isNotifMenuOpen; isUserMenuOpen = false"
              class="relative w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span v-if="totalNotifications > 0" class="absolute top-2 right-2 w-1.5 h-1.5 bg-brand rounded-full"></span>
            </button>

            <div v-if="isNotifMenuOpen" @click="isNotifMenuOpen = false" class="fixed inset-0 z-40"></div>

            <div v-if="isNotifMenuOpen" class="absolute right-0 top-12 w-72 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden z-50">
              <div class="p-3.5 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                <h4 class="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Notificaciones</h4>
                <span v-if="totalNotifications > 0" class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand/10 text-brand">{{ totalNotifications }}</span>
              </div>
              <div class="p-4 text-center text-xs text-slate-400 font-light" v-if="totalNotifications === 0">Sin alertas pendientes</div>
              <div v-else class="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/40">
                <button
                  v-if="notifications.resenasNuevas > 0"
                  @click="navigateTo('resenas', 'recibidas')"
                  class="w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs flex items-center gap-3 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>{{ notifications.resenasNuevas }} reseñas en moderación</span>
                </button>
                <button
                  v-if="notifications.seguimientosAtrasados > 0"
                  @click="navigateTo('resenas', 'por_evaluar')"
                  class="w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs flex items-center gap-3 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                  <span>{{ notifications.seguimientosAtrasados }} enlaces activos</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Switch Tema Claro/Oscuro -->
          <button
            @click="toggleTheme"
            class="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            aria-label="Alternar tema"
          >
            <svg v-if="isDarkMode" class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg v-else class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>

          <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

          <!-- Perfil Operador -->
          <button
            @click="navigateTo('perfil')"
            class="flex items-center gap-2.5 pl-2 py-1 pr-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div class="hidden sm:flex flex-col items-end">
              <span class="text-xs font-normal text-slate-800 dark:text-slate-200 leading-tight">{{ userName }}</span>
              <span class="text-[9px] font-mono tracking-widest text-slate-400 uppercase">{{ userRole }}</span>
            </div>
            <div class="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono text-[10px] overflow-hidden">
              <img v-if="currentUser.logo" :src="currentUser.logo" class="w-full h-full object-cover" @error="$event.target.style.display = 'none'" />
              <template v-else>{{ userInitials }}</template>
            </div>
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-hidden p-4 sm:p-8">
        <component :is="currentViewComponent" :config="config" :initial-sub-tab="subTabToOpen" />
      </div>
    </main>
  </div>
</template>
