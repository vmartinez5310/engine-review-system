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
  const url = profile.value.logo?.trim()
  return url && /^https?:\/\//i.test(url) ? url : null
})

const initials = computed(() =>
  (profile.value.nombre || 'U').slice(0, 2).toUpperCase()
)

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
  const nombre = profile.value.nombre.trim()
  const email = profile.value.email.trim()

  if (!nombre) {
    return window.Swal?.fire('Atención', 'El nombre no puede estar vacío', 'warning')
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return window.Swal?.fire('Atención', 'Ingresa un correo válido', 'warning')
  }

  isSaving.value = true
  try {
    const logo = profile.value.logo?.trim() || ''

    await apiClient.post('update_profile', {
      nombre,
      email,
      logo
    })

    if (authState.user) {
      authState.user.nombre = nombre
      authState.user.email = email
      authState.user.logo = logo
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
  <div class="h-full w-full flex flex-col overflow-y-auto pb-6 select-none">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-slate-400">
          {{ props.config?.nombre || 'Engine Review' }}
        </p>
        <h2 class="text-2xl font-semibold text-white mt-1">Tu perfil</h2>
        <p class="text-sm text-slate-400 mt-1">
          Así te verán los clientes en las invitaciones y reseñas
        </p>
      </div>

      <BaseButton :is-loading="isSaving" @click="saveProfile">
        Guardar cambios
      </BaseButton>
    </div>

    <SkeletonBlock v-if="isLoading" variant="perfil" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Preview / Identity -->
      <div class="lg:col-span-4 h-full rounded-2xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between mb-6">
          <span class="text-xs font-medium uppercase tracking-wider text-slate-400">
            Cómo apareces
          </span>
          <StatusBadge :status="profile.estado" />
        </div>

        <div class="flex flex-col items-center text-center">
          <div class="w-28 h-28 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center overflow-hidden">
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              :alt="profile.nombre"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-3xl font-semibold text-sky-400">
              {{ initials }}
            </span>
          </div>

          <h3 class="mt-5 text-xl font-semibold text-white truncate max-w-full">
            {{ profile.nombre || 'Tu nombre' }}
          </h3>
          <p class="text-sm text-slate-400 mt-1 truncate max-w-full">
            {{ profile.email || 'tu@email.com' }}
          </p>

          <span class="mt-4 inline-flex px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
            {{ profile.rol }}
          </span>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10 text-xs text-slate-500 text-center">
          Vista previa en tiempo real
        </div>
      </div>

      <!-- Editable fields -->
      <form
        class="lg:col-span-8 h-full rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col"
        @submit.prevent="saveProfile"
      >
        <div class="mb-6">
          <h3 class="text-sm font-medium text-white">Información pública</h3>
          <p class="text-xs text-slate-400 mt-1">
            Estos datos aparecen en las invitaciones que envías y en los registros de reseñas
          </p>
        </div>

        <div class="space-y-5 flex-1">
          <BaseInput
            v-model="profile.nombre"
            label="Nombre visible"
            placeholder="Cómo quieres que te llamen"
          />

          <BaseInput
            v-model="profile.email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
          />

          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <div class="flex-1">
              <BaseInput
                v-model="profile.logo"
                label="Foto o logo (URL)"
                placeholder="https://..."
              />
              <p class="text-xs text-slate-500 mt-1.5">
                Se actualiza al instante en la barra superior y en las invitaciones
              </p>
            </div>

            <div class="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              <img
                v-if="avatarPreview"
                :src="avatarPreview"
                alt="Preview"
                class="w-full h-full object-cover"
              />
              <i v-else class="fas fa-user text-slate-500 text-sm"></i>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Los cambios se reflejan inmediatamente</span>
          <span class="text-emerald-400 flex items-center gap-1.5">
            <i class="fas fa-check-circle text-[10px]"></i>
            Sincronizado
          </span>
        </div>
      </form>
    </div>
  </div>
</template>