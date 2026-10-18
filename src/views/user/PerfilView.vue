<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../../services/api'

const isLoading = ref(true)
const isSaving = ref(false)

const profile = ref({
  idUser: '',
  nombre: '',
  email: '',
  rol: 'ADMINISTRADOR',
  estado: 'Activo',
  logo: ''
})

const avatarPreview = computed(() => {
  const u = (profile.value.logo || '').trim()
  return /^https?:\/\//i.test(u) ? u : null
})

function initials(name) {
  return (name || 'U').substring(0, 2).toUpperCase()
}

async function loadProfile() {
  isLoading.value = true
  try {
    const data = await apiClient.post('get_user_info')
    if (data) {
      profile.value = {
        idUser: data.idUser || data.id || '',
        nombre: data.nombre || '',
        email: data.email || '',
        rol: data.rol || 'USUARIO',
        estado: data.estado || 'Activo',
        logo: data.logo || data.avatar || ''
      }
    }
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

async function saveProfile() {
  if (!profile.value.nombre) {
    return window.Swal?.fire('Atención', 'El nombre no puede estar vacío', 'warning')
  }
  isSaving.value = true
  try {
    await apiClient.post('update_profile', {
      nombre: profile.value.nombre,
      logo: (profile.value.logo || '').trim()
    })
    window.Swal?.fire({
      icon: 'success',
      title: 'Perfil actualizado',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-y-auto lg:overflow-hidden pb-4 lg:pb-1 select-none">
    
    <!-- HEADER EJECUTIVO -->
    <div class="shrink-0 flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Credenciales de Operador • Cuenta Verificada
          </span>
        </div>
        <div class="flex items-baseline gap-3 mt-0.5">
          <h2 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mi Perfil
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 hidden md:inline-block">
            Información personal, avatar y nivel de autorización
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <BaseButton
          :is-loading="isSaving"
          icon="fas fa-save"
          @click="saveProfile"
        >
          Guardar cambios
        </BaseButton>
      </div>
    </div>

    <!-- SKELETON DE CARGA -->
    <div v-if="isLoading" class="flex-1 min-h-0">
      <SkeletonBlock variant="form" :rows="4" />
    </div>

    <!-- CONTENIDO PRINCIPAL SIN SCROLL (12 Columnas) -->
    <div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      <!-- COLUMNA IZQUIERDA (5 cols): TARJETA DE IDENTIDAD EJECUTIVA -->
      <div class="lg:col-span-5 relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-gradient-to-br from-white via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-sky-950/20 p-6 flex flex-col justify-between shadow-sm">
        <div class="absolute -right-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Credencial Digital
          </span>
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {{ profile.estado || 'Activo' }}
          </span>
        </div>

        <!-- Avatar grande centrado + Nombre -->
        <div class="my-auto flex flex-col items-center text-center py-4">
          <div class="w-24 h-24 xl:w-28 xl:h-28 rounded-full overflow-hidden bg-sky-500/20 border-2 border-sky-400/40 flex items-center justify-center shadow-lg">
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              :alt="profile.nombre"
              class="w-full h-full object-cover"
              @error="$event.target.style.display = 'none'"
            />
            <span v-else class="text-3xl font-extrabold text-sky-400">
              {{ initials(profile.nombre) }}
            </span>
          </div>

          <h3 class="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
            {{ profile.nombre || 'Operador' }}
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {{ profile.email }}
          </p>
        </div>

        <!-- Metadatos inferiores (Rol e ID) -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-3">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
            <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Rol Asignado
            </span>
            <span class="mt-1 block text-xs font-bold text-sky-400 uppercase tracking-wide">
              {{ profile.rol }}
            </span>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
            <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Acceso al Panel
            </span>
            <span class="mt-1 block text-xs font-bold text-slate-700 dark:text-slate-200">
              Nivel Completo
            </span>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA (7 cols): FORMULARIO DE EDICIÓN RÁPIDA -->
      <div class="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-6 flex flex-col justify-between gap-4 shadow-sm">
        
        <div class="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div class="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <i class="fas fa-user-edit text-xs"></i>
          </div>
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Datos de la Cuenta
            </h3>
            <p class="text-[11px] text-slate-400 dark:text-slate-500">
              Actualiza tu nombre visible e imagen de perfil en el sistema
            </p>
          </div>
        </div>

        <div class="space-y-4 my-auto">
          <BaseInput
            v-model="profile.nombre"
            label="Nombre completo"
            placeholder="Samuel Trujillo"
            icon="fas fa-user"
          />

          <div>
            <BaseInput
              v-model="profile.logo"
              label="Avatar (URL)"
              placeholder="https://..."
              icon="fas fa-image"
            />
            <p class="text-[11px] text-slate-400 mt-1">
              URL pública de imagen. Se muestra en la barra superior y en el listado de usuarios.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">
                Correo electrónico (Solo lectura)
              </label>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-sm text-slate-400 flex items-center gap-2.5">
                <i class="fas fa-lock text-xs"></i>
                <span class="truncate">{{ profile.email }}</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">
                Rol de seguridad (Solo lectura)
              </label>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-sm font-bold text-sky-400 flex items-center gap-2.5">
                <i class="fas fa-shield-alt text-xs"></i>
                <span>{{ profile.rol }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Los cambios se reflejan al instante en tu sesión activa.</span>
          <i class="fas fa-check-circle text-emerald-400"></i>
        </div>
      </div>

    </div>
  </div>
</template>