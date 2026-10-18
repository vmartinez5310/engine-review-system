<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../../services/api'
import { authState } from '../../composables/useAuth'
import SkeletonBlock from '../../components/ui/SkeletonBlock.vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) }
})

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
  if (!profile.value.nombre.trim()) {
    return window.Swal?.fire('Atención', 'El nombre no puede estar vacío', 'warning')
  }
  isSaving.value = true
  try {
    const cleanName = profile.value.nombre.trim()
    const cleanLogo = (profile.value.logo || '').trim()

    await apiClient.post('update_profile', {
      nombre: cleanName,
      logo: cleanLogo
    })

    if (authState.user) {
      authState.user.nombre = cleanName
      authState.user.logo = cleanLogo
    }

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
  <div class="h-full w-full flex flex-col overflow-y-auto lg:overflow-hidden pb-6 lg:pb-2 select-none">
    
    <!-- HEADER EJECUTIVO UNIFICADO -->
    <div class="shrink-0 flex flex-wrap items-center justify-between gap-4 pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {{ props.config?.nombre || 'Sistema de Reseñas' }} • Cuenta de Operador
          </span>
        </div>
        <div class="flex items-baseline gap-3 mt-0.5">
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mi Perfil
          </h2>
        </div>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <BaseButton
          :is-loading="isSaving"
          icon="fas fa-save"
          @click="saveProfile"
        >
          Guardar cambios
        </BaseButton>
      </div>
    </div>

    <!-- SKELETON EXACTO -->
    <div v-if="isLoading" class="flex-1 min-h-0">
      <SkeletonBlock variant="perfil" />
    </div>

    <!-- BENTO GRID ENFOCADO (4 Cols Credencial + 8 Cols Edición) -->
    <div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      <!-- COLUMNA IZQUIERDA (4 cols): TARJETA DE IDENTIDAD LIMPIA -->
      <div class="lg:col-span-4 relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-gradient-to-br from-white via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-sky-950/20 p-6 flex flex-col justify-between shadow-sm">
        <div class="absolute -right-12 -top-12 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Identidad Activa
          </span>
          <StatusBadge :status="profile.estado || 'Activo'" />
        </div>

        <div class="my-auto flex flex-col items-center text-center py-4">
          <div class="w-24 h-24 rounded-2xl overflow-hidden bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shadow-md">
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

          <h3 class="mt-4 text-xl font-bold text-slate-900 dark:text-white truncate max-w-full">
            {{ profile.nombre || 'Operador' }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-full">
            {{ profile.email }}
          </p>

          <span class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <i class="fas fa-shield-alt text-[10px]"></i>
            {{ profile.rol }}
          </span>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>ID de Operador</span>
          <span class="font-mono text-slate-600 dark:text-slate-300">{{ profile.idUser || 'SESIÓN ACTIVA' }}</span>
        </div>
      </div>

      <!-- COLUMNA DERECHA (8 cols): PREFERENCIAS EDITABLES SIN RUIDO -->
      <form
        class="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-6 flex flex-col justify-between gap-4 shadow-sm"
        @submit.prevent="saveProfile"
      >
        <div class="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div class="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <i class="fas fa-sliders-h text-xs"></i>
          </div>
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Perfil Público del Operador
            </h3>
            <p class="text-[11px] text-slate-400 dark:text-slate-500">
              Personaliza cómo aparece tu nombre y fotografía en las invitaciones y registros
            </p>
          </div>
        </div>

        <div class="space-y-5 my-auto">
          <BaseInput
            v-model="profile.nombre"
            label="Nombre visible"
            placeholder="Ej. Samuel Trujillo"
            icon="fas fa-user"
          />

          <div class="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="flex-1 min-w-0">
              <BaseInput
                v-model="profile.logo"
                label="Fotografía / Avatar (URL)"
                placeholder="https://..."
                icon="fas fa-image"
              />
              <p class="text-[11px] text-slate-400 mt-1">
                URL pública de imagen. Se actualiza al instante en la barra superior.
              </p>
            </div>

            <div class="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden self-center">
              <img
                v-if="avatarPreview"
                :src="avatarPreview"
                alt="Preview"
                class="w-full h-full object-cover"
                @error="$event.target.style.display = 'none'"
              />
              <i v-else class="fas fa-user text-slate-500 text-sm"></i>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>El correo electrónico y el rol son administrados por el sistema central.</span>
          <span class="text-emerald-400 font-semibold flex items-center gap-1.5">
            <i class="fas fa-check-circle"></i> Sincronizado
          </span>
        </div>
      </form>

    </div>
  </div>
</template>