<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../services/api'
import DataTable from '../components/ui/DataTable.vue'

const props = defineProps({
  userRole: String,
  activeSubTab: { type: String, default: 'usuarios' }
})

// --- ESTADO GENERAL ---
const isLoading = ref(true)

// --- ESTADO PARA USUARIOS ---
const users = ref([])
const showAddUserModal = ref(false)
const newUser = ref({ nombre: '', email: '', rol: 'USUARIO' })
const isAddingUser = ref(false)
const addUserError = ref('')

// --- ESTADO PARA APARIENCIA ---
const appConfig = ref({ Empresa_Nombre: '', Color_Primario: '', logoH: '', logoV: '' })
const isSavingConfig = ref(false)
const isConfigLoading = ref(true) // Nuevo estado para el skeleton de apariencia
const configError = ref('')

onMounted(async () => {
  // Disparamos ambas peticiones en paralelo para mayor velocidad
  loadUsers()
  loadCurrentConfig()
})

// --- FUNCIONES DE USUARIOS ---
async function loadUsers() {
  isLoading.value = true
  try {
    users.value = await apiClient.post('get_users')
  } catch (e) {
    console.error('Error al cargar usuarios:', e)
  } finally {
    isLoading.value = false
  }
}

async function toggleUserStatus(user) {
  const newStatus = user.estado === 'Activo' ? 'Inactivo' : 'Activo'
  try {
    await apiClient.post('update_user', { fila: user.fila, estado: newStatus })
    user.estado = newStatus
    window.Swal.fire({ icon: 'success', title: 'Estado actualizado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
  } catch (e) {
    window.Swal.fire('Error', e.message, 'error')
  }
}

async function addUser() {
  addUserError.value = ''

  if (!newUser.value.nombre.trim()) {
    addUserError.value = 'El nombre es obligatorio.'
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!newUser.value.email.trim() || !emailRegex.test(newUser.value.email)) {
    addUserError.value = 'Ingresa un correo electrónico válido.'
    return
  }

  isAddingUser.value = true

  try {
    const idUser = 'USR-' + Math.floor(Math.random() * 10000)
    await apiClient.post('add_user', { ...newUser.value, idUser })

    closeUserModal()
    window.Swal.fire({ icon: 'success', title: 'Usuario invitado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 })
    await loadUsers()
  } catch (e) {
    addUserError.value = e.message || 'Error al guardar el usuario.'
  } finally {
    isAddingUser.value = false
  }
}

function closeUserModal() {
  showAddUserModal.value = false
  newUser.value = { nombre: '', email: '', rol: 'USUARIO' }
  addUserError.value = ''
}

// --- FUNCIONES DE APARIENCIA ---
async function loadCurrentConfig() {
  isConfigLoading.value = true
  try {
    const config = await apiClient.post('get_public_config')
    appConfig.value = {
      Empresa_Nombre: config.nombre || '',
      Color_Primario: config.color || '#334155',
      logoH: config.logoH || '',
      logoV: config.logoV || ''
    }
  } catch (e) {
    console.error(e)
  } finally {
    // Pequeña pausa estética para que el skeleton se aprecie fluido
    setTimeout(() => { isConfigLoading.value = false }, 400)
  }
}

async function saveConfig() {
  configError.value = ''

  if (!appConfig.value.Empresa_Nombre.trim()) {
    configError.value = 'El nombre de la empresa no puede estar vacío.'
    return
  }
  if (!/^#[0-9A-F]{6}$/i.test(appConfig.value.Color_Primario)) {
    configError.value = 'Ingresa un color hexadecimal válido (ej. #9E2A5E).'
    return
  }

  isSavingConfig.value = true

  try {
    // Empaquetamos la configuración para enviarla al backend
    const payload = {
      Empresa_Nombre: appConfig.value.Empresa_Nombre,
      Color_Primario: appConfig.value.Color_Primario,
      Logo_Horizontal: appConfig.value.logoH,
      Logo_Vertical: appConfig.value.logoV
    }

    await apiClient.post('update_config', { configuracion: payload })

    document.documentElement.style.setProperty('--brand-color', appConfig.value.Color_Primario)

    window.Swal.fire({
      icon: 'success',
      title: 'Apariencia actualizada',
      text: 'Los logotipos se reflejarán al recargar la página.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000
    })
  } catch (e) {
    configError.value = e.message || 'Error al guardar la configuración.'
  } finally {
    isSavingConfig.value = false
  }
}

</script>

<template>

  <div class="h-full flex flex-col gap-6">

    <!-- PESTAÑA 1: GESTIÓN DE USUARIOS -->
    <div v-if="activeSubTab === 'usuarios'" class="flex-1 flex flex-col h-full relative">
      <div class="flex-1 overflow-hidden">
        <DataTable
          :columns="[{ key: 'nombre', label: 'Nombre' }, { key: 'email', label: 'Correo Electrónico' }, { key: 'rol', label: 'Rol' }, { key: 'estado', label: 'Estado' }]"
          :data="users" :is-loading="isLoading" search-placeholder="Buscar usuario..."
          :filter-options="['Activo', 'Inactivo']" filter-column-key="estado">
          <template #header-actions>
            <button @click="showAddUserModal = true"
              class="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand/20 hover:brightness-110 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95">
              <i class="fas fa-plus"></i> <span class="hidden sm:inline">Añadir Gestor</span>
            </button>
          </template>

          <!-- Slot: Personalización visual de la columna Estado -->
          <template #cell-estado="{ item }">
            <span v-if="item.estado === 'Activo'"
              class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">Activo</span>
            <span v-else-if="item.estado === 'Pendiente'"
              class="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">Pendiente</span>
            <span v-else
              class="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-semibold">Inactivo</span>
          </template>

          <!-- Slot: Acciones -->
          <template #actions="{ item }">
            <div class="flex gap-2">
              <button v-if="item.estado !== 'Activo'" @click="toggleUserStatus(item)" title="Activar usuario"
                class="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition shadow-sm">
                <i class="fas fa-user-check"></i>
              </button>
              <button v-if="item.estado === 'Activo'" @click="toggleUserStatus(item)" title="Suspender usuario"
                class="text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition shadow-sm">
                <i class="fas fa-user-slash"></i>
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- PESTAÑA 2: PERSONALIZACIÓN VISUAL -->
    <div v-if="activeSubTab === 'apariencia'"
      class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-2xl h-full overflow-y-auto custom-scrollbar transition-colors">
      <h2 class="font-bold text-xl text-slate-800 dark:text-slate-200 mb-6">Apariencia de la Marca</h2>

      <!-- SKELETON DE CARGA -->
      <div v-if="isConfigLoading" class="space-y-6 animate-pulse">
        <div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-3"></div>
          <div class="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl w-full"></div>
        </div>
        <div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
          <div class="flex gap-4">
            <div class="w-14 h-14 bg-slate-100 dark:bg-slate-700/50 rounded-xl"></div>
            <div class="h-14 bg-slate-100 dark:bg-slate-700/50 rounded-xl flex-1"></div>
          </div>
        </div>
        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-3"></div>
          <div class="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl w-full mb-4"></div>
          <div class="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl w-full"></div>
        </div>
        <div class="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-40 mt-4"></div>
      </div>

      <!-- FORMULARIO REAL -->
      <form v-else @submit.prevent="saveConfig" class="space-y-6 fade-in" novalidate>

        <!-- Bloque 1: Básicos -->
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Nombre de la
              Empresa</label>
            <input v-model="appConfig.Empresa_Nombre" type="text"
              class="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand dark:text-white transition-colors"
              placeholder="Ej. Inmobiliarte" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Color Primario
              (Acento)</label>
            <div class="flex gap-4 items-center">
              <input v-model="appConfig.Color_Primario" type="color"
                class="w-14 h-14 rounded-xl cursor-pointer bg-transparent border-0 p-0" />
              <input v-model="appConfig.Color_Primario" type="text"
                class="flex-1 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono dark:text-white uppercase transition-colors"
                maxlength="7" placeholder="#000000" />
            </div>
            <p class="text-xs text-slate-400 mt-2">Este color definirá los botones y estados activos.</p>
          </div>
        </div>

        <hr class="border-slate-100 dark:border-slate-700/50 my-6">

        <!-- Bloque 2: Logotipos -->
        <div class="space-y-6">
          <div class="mb-4">
            <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200">Logotipos (Opcional)</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Si no cuentas con logotipos, el sistema generará un
              ícono
              automático usando la inicial de tu empresa.</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">URL del Símbolo
              (Cuadrado)</label>
            <div class="flex gap-3">
              <div
                class="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="appConfig.logoV" :src="appConfig.logoV" class="w-full h-full object-contain p-1" />
                <i v-else class="fas fa-image text-slate-300 dark:text-slate-600 text-lg"></i>
              </div>
              <input v-model="appConfig.logoV" type="url"
                class="flex-1 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand dark:text-white transition-colors text-sm"
                placeholder="https://tudominio.com/icono.png" />
            </div>
            <p class="text-xs text-slate-400 mt-2">Usado en el menú colapsado. Ideal en formato PNG sin fondo.</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">URL del Logo Extendido
              (Horizontal)</label>
            <div class="flex gap-3">
              <div
                class="w-20 h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden shrink-0 px-2">
                <img v-if="appConfig.logoH" :src="appConfig.logoH" class="w-full h-full object-contain" />
                <i v-else class="fas fa-image text-slate-300 dark:text-slate-600 text-lg"></i>
              </div>
              <input v-model="appConfig.logoH" type="url"
                class="flex-1 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand dark:text-white transition-colors text-sm"
                placeholder="https://tudominio.com/logo-completo.png" />
            </div>
            <p class="text-xs text-slate-400 mt-2">Usado en la pantalla de inicio y menú expandido.</p>
          </div>
        </div>

        <Transition name="fade">
          <p v-if="configError" class="text-red-500 text-sm font-medium"><i class="fas fa-exclamation-circle mr-1"></i>
            {{
              configError }}</p>
        </Transition>

        <button type="submit" :disabled="isSavingConfig"
          class="bg-brand text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-brand/20 hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto active:scale-95 mt-4">
          <i v-if="isSavingConfig" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          <span>{{ isSavingConfig ? 'Guardando...' : 'Guardar Cambios' }}</span>
        </button>
      </form>
    </div>

    <!-- MODAL PARA AÑADIR USUARIO -->
    <Transition name="fade">
      <div v-if="showAddUserModal"
        class="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div
          class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-700 transform transition-all">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-bold text-lg text-slate-800 dark:text-white">Añadir Nuevo Gestor</h3>
            <button @click="closeUserModal"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <form @submit.prevent="addUser" class="space-y-4" novalidate>
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-300">Nombre Completo</label>
              <input v-model="newUser.nombre" type="text"
                class="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand dark:text-white transition-colors"
                placeholder="Ej. Juan Pérez" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-300">Correo
                Electrónico</label>
              <input v-model="newUser.email" type="email"
                class="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand dark:text-white transition-colors"
                placeholder="juan@empresa.com" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-300">Nivel de Acceso</label>
              <select v-model="newUser.rol"
                class="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand dark:text-white transition-colors cursor-pointer">
                <option value="USUARIO">Usuario (Solo ver e invitar)</option>
                <option value="APROBADOR">Aprobador (Aprobar reseñas)</option>
                <option value="ADMINISTRADOR">Administrador (Acceso total)</option>
              </select>
            </div>

            <Transition name="fade">
              <p v-if="addUserError" class="text-red-500 text-sm font-medium"><i
                  class="fas fa-exclamation-circle mr-1"></i>
                {{ addUserError }}</p>
            </Transition>

            <div class="flex justify-end gap-3 mt-8">
              <button type="button" @click="closeUserModal" :disabled="isAddingUser"
                class="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-medium transition-colors disabled:opacity-50">Cancelar</button>

              <button type="submit" :disabled="isAddingUser"
                class="px-5 py-2.5 rounded-xl text-white bg-brand hover:brightness-110 shadow-md shadow-brand/20 font-semibold transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95">
                <i v-if="isAddingUser" class="fas fa-spinner fa-spin"></i>
                <span>{{ isAddingUser ? 'Guardando...' : 'Enviar Invitación' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(5px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>