<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { authState, fetchUserInfo } from '../../composables/useAuth'
import SkeletonBlock from '../../components/ui/SkeletonBlock.vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) }
})

const isLoading = ref(true)
const isSaving = ref(false)
const profile = ref({
  id: '',
  idUser: '',
  nombre: '',
  email: '',
  rol: 'USUARIO',
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
  if (authState.user) {
    profile.value = {
      id: authState.user.id || '',
      idUser: authState.user.userId || '',
      nombre: authState.user.nombre || '',
      email: authState.user.email || '',
      rol: authState.user.rol || 'USUARIO',
      estado: authState.user.estado || 'Activo',
      logo: authState.user.logo || ''
    }
    isLoading.value = false
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('whitelist')
      .select('*')
      .ilike('email', user.email)
      .maybeSingle()

    if (error) throw error
    if (data) {
      profile.value = {
        id: data.id,
        idUser: data.user_id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        estado: data.estado,
        logo: data.logo || ''
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
  if (!nombre) {
    return window.Swal?.fire('Atención', 'El nombre no puede estar vacío', 'warning')
  }

  isSaving.value = true
  try {
    const { error } = await supabase
      .from('whitelist')
      .update({
        nombre,
        logo: profile.value.logo?.trim() || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.value.id)

    if (error) throw error
    await fetchUserInfo()

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
    <div class="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {{ props.config?.nombre || 'Gestión de Cuenta' }}
        </p>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">Perfil del Operador</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Datos de contacto e imagen de firma
        </p>
      </div>

      <BaseButton :is-loading="isSaving" @click="saveProfile">
        Guardar cambios
      </BaseButton>
    </div>

    <SkeletonBlock v-if="isLoading" variant="perfil" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- Tarjeta de Identidad: Colores neutros de alto contraste -->
      <div class="lg:col-span-4 h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-6 flex flex-col justify-between shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Estado</span>
          <StatusBadge :status="profile.estado" />
        </div>

        <div class="flex flex-col items-center text-center my-auto">
          <!-- Contenedor neutro para evitar colisión de tono si la foto/logo tiene color de acento -->
          <div class="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
            <img v-if="avatarPreview" :src="avatarPreview" :alt="profile.nombre" class="w-full h-full object-cover" />
            <span v-else class="text-2xl font-bold text-slate-700 dark:text-slate-200">{{ initials }}</span>
          </div>

          <h3 class="mt-4 text-lg font-bold text-slate-900 dark:text-white truncate max-w-full">
            {{ profile.nombre || 'Operador' }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-full">
            {{ profile.email }}
          </p>

          <span class="mt-3 inline-flex px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
            {{ profile.rol }}
          </span>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-center">
          <span class="text-[11px] font-mono text-slate-400">ID: {{ profile.idUser || '---' }}</span>
        </div>
      </div>

      <form class="lg:col-span-8 h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-6 flex flex-col shadow-sm" @submit.prevent="saveProfile">
        <div class="mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Información Personal</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nombre que verán tus clientes en los enlaces</p>
        </div>
        <div class="space-y-4 flex-1">
          <BaseInput v-model="profile.nombre" label="Nombre completo" placeholder="Ej. Carlos Mendoza" />
          <BaseInput v-model="profile.email" label="Correo institucional" readonly />
          <BaseInput v-model="profile.logo" label="URL de avatar o fotografía" placeholder="https://..." />
        </div>
      </form>
    </div>
  </div>
</template>
