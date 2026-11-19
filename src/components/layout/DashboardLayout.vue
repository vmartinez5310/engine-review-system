<script setup>
import { ref, onMounted, computed, defineAsyncComponent, watch } from 'vue'
import { authState, hasPermission } from '../../composables/useAuth'
import GenerarResenaModal from '../../views/core/GenerarResenaModal.vue'

const props = defineProps({ config: Object })
const emit = defineEmits(['logout'])

const isMinified = ref(false)
const isDarkMode = ref(false)
const isUserMenuOpen = ref(false)
const isNotifMenuOpen = ref(false)
const showGlobalInviteModal = ref(false)

const isRefreshing = ref(false)
const pullDistance = ref(0)
let startY = 0

const initialTab = new URLSearchParams(window.location.search).get('tab') || sessionStorage.getItem('active_tab') || 'home'
const activeTab = ref(initialTab)
const subTabToOpen = ref(new URLSearchParams(window.location.search).get('subtab') || null)

watch(activeTab, (newTab) => {
  sessionStorage.setItem('active_tab', newTab)
  const url = new URL(window.location.href)
  url.searchParams.set('tab', newTab)
  window.history.replaceState({}, '', url)
})

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
    home: 'Inicio',
    resenas: 'Reseñas',
    usuarios: 'Usuarios',
    sistema: 'Configuración',
    perfil: 'Perfil'
  }
  return titles[activeTab.value] || 'Panel'
})

const currentUser = computed(() => authState.user || {})
const userName = computed(() => currentUser.value.nombre || 'Operador')
const userInitials = computed(() => (currentUser.value.nombre || 'U').slice(0, 2).toUpperCase())

const notifications = computed(() => currentUser.value.notificaciones || { resenasNuevas: 0, seguimientosAtrasados: 0 })
const totalNotifications = computed(() => {
  return (notifications.value.resenasNuevas || 0) + (notifications.value.seguimientosAtrasados || 0)
})

function navigateTo(tab, subTab = null) {
  activeTab.value = tab
  subTabToOpen.value = subTab
  isUserMenuOpen.value = false
  isNotifMenuOpen.value = false
}

function handleFabClick() {
  if (activeTab.value === 'usuarios') {
    window.dispatchEvent(new CustomEvent('fab-add-user'))
  } else if (activeTab.value === 'resenas') {
    window.dispatchEvent(new CustomEvent('fab-new-invitation'))
  } else {
    showGlobalInviteModal.value = true
  }
}

function handleTouchStart(e) {
  if (window.scrollY === 0) {
    startY = e.touches[0].clientY
  }
}

function handleTouchMove(e) {
  if (startY > 0) {
    const diff = e.touches[0].clientY - startY
    if (diff > 0) {
      pullDistance.value = Math.min(diff * 0.4, 60)
    }
  }
}

async function handleTouchEnd() {
  if (pullDistance.value >= 45) {
    isRefreshing.value = true
    window.dispatchEvent(new CustomEvent('app-global-refresh'))
    setTimeout(() => {
      isRefreshing.value = false
      pullDistance.value = 0
    }, 800)
  } else {
    pullDistance.value = 0
  }
  startY = 0
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
  isUserMenuOpen.value = false
  emit('logout')
}

onMounted(() => {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <div class="h-screen flex w-full relative overflow-hidden text-slate-800 dark:text-slate-200 antialiased bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <aside :class="[
        'hidden md:flex bg-white/80 dark:bg-[#0B1120]/90 backdrop-blur-xl border-r border-slate-200/70 dark:border-slate-800/60 transition-all duration-300 flex-col shrink-0 relative z-30',
        isMinified ? 'w-16' : 'w-56'
      ]">
      <button type="button" @click="isMinified = !isMinified" class="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white shadow-sm z-40 cursor-pointer" aria-label="Minificar">
        <svg class="w-3 h-3 transform transition-transform" :class="isMinified ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div class="h-16 px-4 flex items-center border-b border-slate-200/60 dark:border-slate-800/50 shrink-0 overflow-hidden" :class="isMinified ? 'justify-center px-0' : 'justify-start'">
        <div v-if="isMinified" class="w-8 h-8 rounded flex items-center justify-center overflow-hidden shrink-0">
          <img v-if="config?.logoH || config?.logoV" :src="config.logoH || config.logoV" class="w-full h-full object-contain">
          <span v-else class="text-xs font-semibold text-slate-900 dark:text-white">{{ config?.nombre?.charAt(0) || 'E' }}</span>
        </div>
        <div v-else class="flex items-center w-full">
          <img v-if="config?.logoH || config?.logoV" :src="config.logoH || config.logoV" class="h-7 object-contain max-w-[130px]">
          <h1 v-else class="font-medium text-slate-900 dark:text-white text-sm tracking-tight truncate">{{ config?.nombre || 'Engine Review' }}</h1>
        </div>
      </div>

      <nav class="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        <button type="button" @click="navigateTo('home')" :class="[
            'w-full h-9 flex items-center px-3 rounded-full transition-colors text-xs font-medium cursor-pointer',
            activeTab === 'home'
              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/30'
          ]">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0" :class="activeTab === 'home' ? 'text-brand' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span v-show="!isMinified" class="ml-2.5 truncate">Inicio</span>
          </div>
        </button>

        <button type="button" @click="navigateTo('resenas')" :class="[
            'w-full h-9 flex items-center px-3 rounded-full transition-colors text-xs font-medium cursor-pointer',
            activeTab === 'resenas'
              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/30'
          ]">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0" :class="activeTab === 'resenas' ? 'text-brand' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span v-show="!isMinified" class="ml-2.5 truncate">Reseñas</span>
          </div>
        </button>

        <button v-if="hasPermission('gestionar_usuarios')" type="button" @click="navigateTo('usuarios')" :class="[
            'w-full h-9 flex items-center px-3 rounded-full transition-colors text-xs font-medium cursor-pointer',
            activeTab === 'usuarios'
              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/30'
          ]">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0" :class="activeTab === 'usuarios' ? 'text-brand' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
            <span v-show="!isMinified" class="ml-2.5 truncate">Usuarios</span>
          </div>
        </button>

        <button v-if="hasPermission('configurar_sistema')" type="button" @click="navigateTo('sistema')" :class="[
            'w-full h-9 flex items-center px-3 rounded-full transition-colors text-xs font-medium cursor-pointer',
            activeTab === 'sistema'
              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/30'
          ]">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <svg class="w-4 h-4 shrink-0" :class="activeTab === 'sistema' ? 'text-brand' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0 1.82-.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span v-show="!isMinified" class="ml-2.5 truncate">Configuración</span>
          </div>
        </button>
      </nav>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10 pb-16 md:pb-0">
      <div v-if pullDistance> 0 || isRefreshing"
        class="flex items-center justify-center py-2 transition-all"
        :style="{ height: pullDistance + 'px' }"
      >
        <svg :class="['w-5 h-5 text-brand', { 'animate-spin': isRefreshing }]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67">
        </svg>
      </div>

      <header class="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/50 h-14 px-4 sm:px-8 flex items-center justify-between shrink-0 z-30 sticky top-0">
        <div class="flex items-center gap-2">
          <div class="md:hidden w-7 h-7 flex items-center justify-center">
            <img v-if="config?.logoH || config?.logoV" :src="config.logoH || config.logoV" class="w-full h-full object-contain">
          </div>
          <h2 class="text-xs sm:text-sm font-medium tracking-wide text-slate-900 dark:text-slate-100">{{ pageTitle }}</h2>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <div class="relative flex items-center">
            <button type="button" @click="isNotifMenuOpen = !isNotifMenuOpen; isUserMenuOpen = false" class="relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span v-if totalNotifications> 0" class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full"></span>
            </button>

            <div v-if="isNotifMenuOpen" @click="isNotifMenuOpen = false" class="fixed inset-0 z-40"></div>

            <div v-if="isNotifMenuOpen" class="absolute right-0 top-11 w-64 bg-white dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50">
              <div class="p-3 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs">
                <span class="font-medium text-slate-500">Notificaciones</span>
                <span v-if totalNotifications> 0" class="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs">{{ totalNotifications }}</span>
              </div>
              <div class="p-4 text-center text-xs text-slate-400" v-if="totalNotifications === 0">Sin alertas pendientes</div>
              <div v-else class="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/40">
                <button v-if notifications resenasNuevas> 0"
                  type="button"
                  @click="navigateTo('resenas', 'recibidas')"
                  class="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>{{ notifications.resenasNuevas }} reseñas en moderación</span>
                </button>
                <button v-if notifications seguimientosAtrasados> 0"
                  type="button"
                  @click="navigateTo('resenas', 'por_evaluar')"
                  class="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                  <span>{{ notifications.seguimientosAtrasados }} enlaces activos</span>
                </button>
              </div>
            </div>
          </div>

          <div class="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

          <div class="relative flex items-center">
            <button type="button" @click="isUserMenuOpen = !isUserMenuOpen; isNotifMenuOpen = false" class="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
              <div class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-medium overflow-hidden">
                <img v-if="currentUser.logo" :src="currentUser.logo" class="w-full h-full object-cover" @error="$event.target.style.display = 'none'">
                <template v-else>{{ userInitials }}</template>
              </div>
              <span class="hidden sm:inline text-xs font-normal text-slate-800 dark:text-slate-200">{{ userName }}</span>
            </button>

            <div v-if="isUserMenuOpen" @click="isUserMenuOpen = false" class="fixed inset-0 z-40"></div>

            <div v-if="isUserMenuOpen" class="absolute right-0 top-11 w-56 bg-white dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50 text-xs">
              <div class="p-3 border-b border-slate-100 dark:border-slate-800/60">
                <p class="font-medium text-slate-900 dark:text-slate-100 truncate">{{ currentUser.nombre }}</p>
                <p class="text-xs text-slate-400 truncate mt-0.5">{{ currentUser.email }}</p>
              </div>

              <div class="p-1.5 space-y-0.5">
                <button type="button" @click="navigateTo('perfil')" class="w-full flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                  <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Mi Perfil</span>
                </button>

                <div @click="toggleTheme" class="w-full flex items-center justify-between px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                  <div class="flex items-center gap-2">
                    <svg v-if="isDarkMode" class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                    </svg>
                    <svg v-else class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    <span>Modo Oscuro</span>
                  </div>
                  <span class="text-xs text-slate-400">{{ isDarkMode ? 'On' : 'Off' }}</span>
                </div>

                <div class="border-t border-slate-100 dark:border-slate-800/60 my-1"></div>

                <button type="button" @click="logout" class="w-full flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                  <svg class="w-3.5 h-3.5 viewBox=" 0 24 fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-4 sm:p-8">
        <component :is="currentViewComponent" :config="config" :initial-sub-tab="subTabToOpen">
      </div>
    </main>

    <div class="md:hidden fixed bottom-0 inset-x-0 h-14 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-50 flex items-center justify-around px-2">
      <button type="button" @click="navigateTo('home')" :class="['flex flex-col items-center justify-center w-12 h-full text-xs transition-colors', activeTab === 'home' ? 'text-brand' : 'text-slate-400']">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </button>

      <button type="button" @click="navigateTo('resenas')" :class="['flex flex-col items-center justify-center w-12 h-full text-xs transition-colors', activeTab === 'resenas' ? 'text-brand' : 'text-slate-400']">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>

      <button type="button" @click="handleFabClick" class="w-12 h-12 -mt-5 bg-brand text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform" aria-label="Nueva acción">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <button v-if="hasPermission('gestionar_usuarios')" type="button" @click="navigateTo('usuarios')" :class="['flex flex-col items-center justify-center w-12 h-full text-xs transition-colors', activeTab === 'usuarios' ? 'text-brand' : 'text-slate-400']">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
      </button>

      <button v-if="hasPermission('configurar_sistema')" type="button" @click="navigateTo('sistema')" :class="['flex flex-col items-center justify-center w-12 h-full text-xs transition-colors', activeTab === 'sistema' ? 'text-brand' : 'text-slate-400']">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0 1.82-.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>

    <GenerarResenaModal v-model="showGlobalInviteModal">
  </div>
</template>
