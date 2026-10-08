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

const activeTab = ref('resenas') 

// --- CARGA PEREZOSA (LAZY LOADING) ---
const ResenasView = defineAsyncComponent(() => import('../../views/core/ResenasView.vue'))
const UsuariosView = defineAsyncComponent(() => import('../../views/admin/UsuariosView.vue'))
const SistemaView = defineAsyncComponent(() => import('../../views/admin/SistemaView.vue'))
const PerfilView = defineAsyncComponent(() => import('../../views/user/PerfilView.vue'))

const currentViewComponent = computed(() => {
  const views = {
    'resenas': ResenasView,
    'usuarios': UsuariosView,
    'sistema': SistemaView,
    'perfil': PerfilView
  }
  return views[activeTab.value] || ResenasView
})

// --- MAPEO DE TÍTULOS ---
const pageTitle = computed(() => {
  const titles = {
    'resenas': 'Centro de Reseñas',
    'usuarios': 'Gestión de Usuarios',
    'sistema': 'Configuración',
    'perfil': 'Mi Perfil'
  }
  return titles[activeTab.value] || 'Dashboard'
})

// --- DATOS DEL USUARIO LOGUEADO ---
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

// --- LÓGICA DE NOTIFICACIONES ---
const notifications = computed(() => currentUser.value.notificaciones || { resenasNuevas: 0, seguimientosAtrasados: 0 })
const totalNotifications = computed(() => {
  return (notifications.value.resenasNuevas || 0) + (notifications.value.seguimientosAtrasados || 0)
})

// --- FUNCIONES GLOBALES DE LA VISTA ---
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

// --- CICLO DE VIDA ---
onMounted(() => {
  // 1. Restaurar el tema oscuro
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }

  // 2. Control de redimensionamiento de ventana
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
    
    <!-- ========================================== -->
    <!-- SIDEBAR: ESTILO MODERNO MINIMALISTA        -->
    <!-- ========================================== -->
    <aside :class="[
        'fixed inset-y-0 left-0 bg-[#0F172A] border-r border-slate-800 z-50 transform md:relative transition-all duration-300 ease-in-out flex flex-col shrink-0',
        isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
        isMinified ? 'w-20' : 'w-64'
      ]">
      
      <!-- Botón Minificar -->
      <button @click="isMinified = !isMinified" 
        class="hidden md:flex absolute -right-3.5 top-8 w-7 h-7 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white shadow-md z-[60] transition-colors">
        <i :class="isMinified ? 'fas fa-chevron-right text-[10px]' : 'fas fa-chevron-left text-[10px]'"></i>
      </button>

      <!-- Logo Area -->
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

      <!-- Menú Superior (Negocio y Administración) -->
      <nav class="flex-1 px-3 py-2 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
        
        <!-- Ítem 1: Reseñas -->
        <button @click="navigateTo('resenas')" 
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'resenas' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-star text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Reseñas</span></Transition>
          </div>
        </button>

        <!-- Ítem 2: Usuarios (Si tiene permiso) -->
        <button v-if="hasPermission('gestionar_usuarios')" @click="navigateTo('usuarios')" 
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'usuarios' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-users text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Usuarios</span></Transition>
          </div>
        </button>

        <!-- Ítem 3: Configuración (Si tiene permiso) -->
        <button v-if="hasPermission('configurar_sistema')" @click="navigateTo('sistema')" 
          :class="['w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium text-sm', activeTab === 'sistema' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
          <div class="flex items-center w-full" :class="isMinified ? 'justify-center' : 'justify-start'">
            <i class="fas fa-cog text-lg w-6 text-center"></i>
            <Transition name="fade-sidebar"><span v-show="!isMinified" class="ml-3 truncate">Configuración</span></Transition>
          </div>
        </button>

      </nav>
      
      <!-- Menú Inferior (Perfil y Logout) - Anclado abajo -->
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

    <!-- ========================================== -->
    <!-- ÁREA DE TRABAJO PRINCIPAL                  -->
    <!-- ========================================== -->
    <main class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden dark:bg-slate-900 transition-colors relative z-10 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-black/20">
      
      <!-- HEADER -->
      <header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 sticky top-0 transition-colors">
        
        <div class="flex items-center gap-3">
          <button @click="isSidebarOpen = !isSidebarOpen" class="md:hidden text-slate-500 hover:text-brand p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <i class="fas fa-bars text-xl"></i>
          </button>
          <span class="inline-block text-sm font-semibold text-slate-400 dark:text-slate-500 ml-2">
            Dashboard / <span class="text-slate-800 dark:text-slate-200">{{ pageTitle }}</span>
          </span>
        </div>
        
        <!-- ICONOS DERECHA (Notificaciones + Usuario) -->
        <!-- ICONOS DERECHA (Notificaciones + Usuario) -->
        <div class="flex items-center gap-3 sm:gap-4">
          
          <!-- ========================================== -->
          <!-- CONTENEDOR DE NOTIFICACIONES               -->
          <!-- ========================================== -->
          <div class="relative flex items-center h-full">
            <button @click="isNotifMenuOpen = !isNotifMenuOpen; isUserMenuOpen = false" class="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-brand dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none">
              <i class="fas fa-bell text-[1.1rem]"></i>
              <!-- El punto rojo solo se dibuja si el backend manda un número mayor a 0 -->
              <span v-if="totalNotifications > 0" class="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </button>

            <!-- Capa invisible para cerrar al hacer clic afuera -->
            <div v-if="isNotifMenuOpen" @click="isNotifMenuOpen = false" class="fixed inset-0 z-40"></div>

            <!-- DROPDOWN DE NOTIFICACIONES -->
            <Transition name="fade-dropdown">
              <div v-if="isNotifMenuOpen" class="absolute right-0 top-[calc(100%+12px)] w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                
                <div class="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h4 class="text-sm font-bold text-slate-800 dark:text-white">Notificaciones</h4>
                  <span v-if="totalNotifications > 0" class="text-[10px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">{{ totalNotifications }}</span>
                </div>

                <div class="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  
                  <!-- ESTADO VACÍO (El que verás ahora mismo) -->
                  <div v-if="totalNotifications === 0" class="p-8 text-center flex flex-col items-center justify-center">
                    <div class="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3">
                      <i class="fas fa-bell-slash text-slate-300 dark:text-slate-600 text-lg"></i>
                    </div>
                    <p class="text-sm font-medium text-slate-600 dark:text-slate-300">Sin notificaciones</p>
                    <p class="text-xs text-slate-400 mt-1">Tu área de trabajo está al día</p>
                  </div>

                  <!-- ELEMENTOS DINÁMICOS (Esperando al Backend) -->
                  <div v-else class="flex flex-col">
                    
                    <!-- Reseñas Nuevas -->
                    <button v-if="notifications.resenasNuevas > 0" @click="navigateTo('resenas')" class="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 transition-colors group">
                      <div class="flex gap-3 items-start">
                        <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <i class="fas fa-star text-xs"></i>
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-brand transition-colors">Nuevas reseñas</p>
                          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Tienes <strong class="text-slate-700 dark:text-slate-300">{{ notifications.resenasNuevas }}</strong> reseñas pendientes de revisión.</p>
                        </div>
                      </div>
                    </button>

                    <!-- Seguimientos Atrasados -->
                    <button v-if="notifications.seguimientosAtrasados > 0" @click="navigateTo('resenas')" class="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      <div class="flex gap-3 items-start">
                        <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 mt-0.5">
                          <i class="fas fa-clock text-xs"></i>
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-brand transition-colors">Seguimientos atrasados</p>
                          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Hay <strong class="text-slate-700 dark:text-slate-300">{{ notifications.seguimientosAtrasados }}</strong> clientes sin evaluar después de 7 días.</p>
                        </div>
                      </div>
                    </button>

                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
          
          <!-- ========================================== -->
          <!-- DROPDOWN DEL USUARIO (PERFIL)                -->
          <!-- ========================================== -->
          <div class="relative flex items-center h-full">
            <button @click="isUserMenuOpen = !isUserMenuOpen; isNotifMenuOpen = false" class="flex items-center gap-3 pl-2 py-1 pr-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none">

              <div class="hidden sm:flex flex-col items-end">
                <span class="text-sm font-bold text-slate-800 dark:text-white leading-tight">{{ userName }}</span>
                <span class="text-[10px] font-semibold text-brand dark:text-brand-light uppercase tracking-wider">{{ userRole }}</span>
              </div>
              <!-- Iniciales Encerradas en un Círculo Perfecto -->
              <div class="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white dark:ring-slate-900 overflow-hidden uppercase">
                {{ userInitials }}
              </div>
              <i class="fas fa-chevron-down text-[10px] text-slate-400 mr-1 transition-transform duration-200" :class="isUserMenuOpen ? 'rotate-180' : ''"></i>
            </button>

            <div v-if="isUserMenuOpen" @click="isUserMenuOpen = false" class="fixed inset-0 z-40"></div>

            <Transition name="fade-dropdown">
              <div v-if="isUserMenuOpen" class="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                
                <div class="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                  <p class="text-sm font-bold text-slate-800 dark:text-white truncate">{{ currentUser.nombre }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{{ currentUser.email }}</p>
                </div>

                <!-- Menú Desplegable (Mismas funciones) -->
                <div class="p-2 border-b border-slate-100 dark:border-slate-700/50">
                  <button @click="navigateTo('perfil')" class="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl flex items-center gap-3 transition-colors">
                    <i class="fas fa-user-circle w-4 text-center text-slate-400"></i> Mi Perfil
                  </button>
                </div>

                <!-- Preferencias (Modo Oscuro) -->
                <div class="p-2 border-b border-slate-100 dark:border-slate-700/50">
                  <button @click="toggleTheme" class="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl flex items-center justify-between transition-colors group">
                    <div class="flex items-center gap-3">
                      <i :class="isDarkMode ? 'fas fa-moon' : 'fas fa-sun'" class="w-4 text-center text-slate-400 group-hover:text-brand transition-colors"></i>
                      <span>Modo Oscuro</span>
                    </div>
                    <div :class="isDarkMode ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-600'" class="w-8 h-4 rounded-full relative transition-colors duration-300 flex items-center px-0.5">
                      <div :class="isDarkMode ? 'translate-x-4' : 'translate-x-0'" class="w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm"></div>
                    </div>
                  </button>
                </div>

                <!-- Salir -->
                <div class="p-2 bg-slate-50/50 dark:bg-slate-900/30">
                  <button @click="logout" class="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition-colors font-medium group">
                    <i class="fas fa-sign-out-alt w-4 text-center text-red-400 group-hover:translate-x-1 transition-transform"></i> Cerrar Sesión
                  </button>
                </div>

              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- ÁREA DE RENDERIZADO ATÓMICO (VISTAS) -->
      <div class="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8 relative bg-slate-50/50 dark:bg-[#0B1120]">
        <Transition name="fade-view" mode="out-in">
          <component :is="currentViewComponent" />
        </Transition>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* Las transiciones visuales se mantienen intactas */
.fade-view-enter-active, .fade-view-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-view-enter-from, .fade-view-leave-to { opacity: 0; transform: translateY(5px); }
.fade-dropdown-enter-active, .fade-dropdown-leave-active { transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-dropdown-enter-from, .fade-dropdown-leave-to { opacity: 0; transform: translateY(-10px) scale(0.95); }
.fade-sidebar-enter-active { transition: opacity 0.3s ease 0.15s; }
.fade-sidebar-leave-active { transition: opacity 0.1s ease; }
.fade-sidebar-enter-from, .fade-sidebar-leave-to { opacity: 0; }
</style>