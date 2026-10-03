<script setup>
import { ref, onMounted, computed } from 'vue'
import ResenasView from '../views/ResenasView.vue'
import Seguimientos from '../views/Seguimientos.vue'
import ConfigView from '../views/ConfigView.vue'

const props = defineProps({ config: Object })
const emit = defineEmits(['logout'])

const activeTab = ref('resenas') 
const isSidebarOpen = ref(false)
const isMinified = ref(false)
const isDarkMode = ref(false)
const userInitials = ref('AD')
const userRole = ref('ADMINISTRADOR')

const pageTitle = computed(() => {
  const titles = {
    'resenas': 'Reseñas',
    'seguimientos': 'Seguimientos',
    'config-usuarios': 'Configuración / Usuarios',
    'config-apariencia': 'Configuración / Apariencia'
  }
  return titles[activeTab.value] || 'Dashboard'
})

const currentView = computed(() => {
  if (activeTab.value.startsWith('config')) return 'config'
  return activeTab.value
})

const currentConfigSubtab = computed(() => {
  return activeTab.value === 'config-apariencia' ? 'apariencia' : 'usuarios'
})

onMounted(() => {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      isSidebarOpen.value = false 
    }
  })
})

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

function logout() { emit('logout') }
</script>

<template>
  <div class="h-screen flex w-full relative overflow-hidden text-slate-800 dark:text-slate-200 antialiased bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    
    <!-- SIDEBAR: Siempre oscuro (Contraste) -->
    <aside :class="[
        'fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 z-50 transform md:relative transition-all duration-300 ease-in-out flex flex-col shrink-0',
        isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
        isMinified ? 'w-20' : 'w-72'
      ]">
      
      <!-- Botón Toggle incrustado (Se mantiene fijo sobre el borde) -->
      <button @click="isMinified = !isMinified" 
        class="hidden md:flex absolute -right-4 top-8 w-8 h-8 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-brand shadow-md z-[60] transition-colors">
        <i :class="isMinified ? 'fas fa-chevron-right text-xs' : 'fas fa-chevron-left text-xs'"></i>
      </button>

      <!-- Logo Area -->
      <div class="p-6 flex items-center h-20 shrink-0 overflow-hidden" :class="isMinified ? 'justify-center' : 'justify-start'">
        <div v-if="isMinified" class="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand/20 shrink-0">
          <img v-if="config?.logoV" :src="config.logoV" class="w-full h-full object-contain p-1" />
          <span v-else class="text-xl drop-shadow-md">{{ config?.nombre?.charAt(0) || 'I' }}</span>
        </div>

        <div v-else class="flex items-center gap-3 w-full">
           <img v-if="config?.logoH" :src="config.logoH" class="h-8 object-contain max-w-[140px]" />
           <div v-else class="flex items-center gap-3">
              <div class="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand/20 shrink-0">
                  <span class="drop-shadow-md">{{ config?.nombre?.charAt(0) || 'I' }}</span>
              </div>
              <h1 class="font-bold text-white text-lg tracking-tight truncate">{{ config?.nombre || 'Dashboard' }}</h1>
           </div>
        </div>
      </div>

<!-- Menú -->
      <nav class="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
        
        <Transition name="fade-sidebar">
          <div v-show="!isMinified" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-3 whitespace-nowrap">Principal</div>
        </Transition>
        
        <!-- Tab: Reseñas -->
        <button @click="activeTab = 'resenas'; isSidebarOpen = false" 
          :class="['w-full flex items-center px-4 py-3 rounded-xl transition-all group', activeTab === 'resenas' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-star text-lg w-6 text-center transition-colors"></i>
            
            <Transition name="fade-sidebar">
              <span v-show="!isMinified" class="ml-3 text-sm whitespace-nowrap flex-1 text-left font-semibold">
                Reseñas
              </span>
            </Transition>

            <Transition name="fade-sidebar">
              <span v-show="!isMinified && activeTab === 'resenas'" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white shadow-inner ml-2">0</span>
            </Transition>
          </div>
        </button>

        <!-- Tab: Seguimientos -->
        <button @click="activeTab = 'seguimientos'; isSidebarOpen = false" 
          :class="['w-full flex items-center px-4 py-3 rounded-xl transition-all group', activeTab === 'seguimientos' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-paper-plane text-lg w-6 text-center transition-colors"></i>
            
            <Transition name="fade-sidebar">
              <span v-show="!isMinified" class="ml-3 text-sm whitespace-nowrap font-semibold">
                Seguimientos
              </span>
            </Transition>
          </div>
        </button>

        <!-- Admin Section -->
        <div v-if="userRole === 'ADMINISTRADOR'" class="mt-6">
          
          <Transition name="fade-sidebar">
            <div v-show="!isMinified" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3 whitespace-nowrap">Administración</div>
          </Transition>
          
          <div class="flex flex-col gap-1">
            <button @click="activeTab = 'config-usuarios'; isSidebarOpen = false" 
              :class="['w-full flex items-center px-4 py-3 rounded-xl transition-all group', activeTab === 'config-usuarios' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']">
              <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
                <i class="fas fa-users text-lg w-6 text-center transition-colors"></i>
                
                <Transition name="fade-sidebar">
                  <span v-show="!isMinified" class="ml-3 text-sm whitespace-nowrap font-semibold">
                    Gestión de Usuarios
                  </span>
                </Transition>
              </div>
            </button>

            <button @click="activeTab = 'config-apariencia'; isSidebarOpen = false" 
              :class="['w-full flex items-center px-4 py-3 rounded-xl transition-all group', activeTab === 'config-apariencia' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']">
              <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
                <i class="fas fa-paint-brush text-lg w-6 text-center transition-colors"></i>
                
                <Transition name="fade-sidebar">
                  <span v-show="!isMinified" class="ml-3 text-sm whitespace-nowrap font-semibold">
                    Personalización
                  </span>
                </Transition>
              </div>
            </button>
          </div>
        </div>
      </nav>
      <!-- Logout -->
      <div class="p-4 border-t border-slate-800 flex flex-col gap-2 bg-slate-900/50">
        <button @click="logout" class="w-full flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-sign-out-alt text-lg w-6 text-center group-hover:-translate-x-1 transition-transform"></i>
            <Transition name="fade-sidebar">
              <span v-show="!isMinified" class="ml-3 font-semibold text-sm whitespace-nowrap">Cerrar Sesión</span>
            </Transition>
          </div>
        </button>
      </div>
    </aside>

    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"></div>

    <!-- MAIN CONTENT -->
    <main class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden dark:bg-slate-900 transition-colors relative z-10 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-black/20">
      
      <!-- HEADER -->
      <header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 sticky top-0 transition-colors">
        
        <div class="flex items-center gap-3">
          <button @click="isSidebarOpen = !isSidebarOpen" class="md:hidden text-slate-500 dark:text-slate-400 hover:text-brand p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <i class="fas fa-bars text-xl"></i>
          </button>
          
          <span class="inline-block text-sm font-semibold text-slate-400 dark:text-slate-500 ml-2">
            Dashboard / <span class="text-slate-800 dark:text-slate-200">{{ pageTitle }}</span>
          </span>
        </div>
        
        <div class="flex items-center gap-2 sm:gap-4">
          <button @click="toggleTheme" class="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-amber-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <i :class="isDarkMode ? 'fas fa-sun text-lg' : 'fas fa-moon text-lg'"></i>
          </button>
          <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <div class="flex items-center gap-3 pl-2">
            <div class="w-9 h-9 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand dark:text-brand-light font-bold text-xs shadow-inner">{{ userInitials }}</div>
          </div>
        </div>
      </header>

      <!-- ÁREA DE PESTAÑAS (Router dinámico) -->
      <div class="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8 relative bg-slate-50/50 dark:bg-[#0B1120]">
        <Transition name="fade" mode="out-in">
          <ResenasView v-if="currentView === 'resenas'" />
          <Seguimientos v-else-if="currentView === 'seguimientos'" />
          <ConfigView v-else-if="currentView === 'config'" :active-sub-tab="currentConfigSubtab" />
        </Transition>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Transición general de vistas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

/* Transición específica para el texto del Sidebar para evitar desbordamiento */
.fade-sidebar-enter-active {
  transition: opacity 0.3s ease 0.15s; /* Se retrasa ligeramente al abrir para que haya espacio */
}
.fade-sidebar-leave-active {
  transition: opacity 0.1s ease; /* Desaparece ultra rápido al cerrar */
}
.fade-sidebar-enter-from,
.fade-sidebar-leave-to {
  opacity: 0;
}
</style>