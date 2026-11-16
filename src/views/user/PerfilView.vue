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
  isLoading.value = true
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
    <div class="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-slate-400">
          {{ props.config?.nombre || 'Engine Review' }}
        </p>
        <h2 class="text-2xl font-semibold text-white mt-1">Tu perfil</h2>
        <p class="text-sm text-slate-400 mt-1">
          Identidad como gestor en el sistema
        </p>
      </div>

      <BaseButton :is-loading="isSaving" @click="saveProfile">
        Guardar cambios
      </BaseButton>
    </div>

    <SkeletonBlock v-if="isLoading" variant="perfil" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-4 h-full rounded-2xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between mb-6">
          <span class="text-xs font-medium uppercase tracking-wider text-slate-400">Estado</span>
          <StatusBadge :status="profile.estado" />
        </div>

        <div class="flex flex-col items-center text-center">
          <div class="w-28 h-28 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center overflow-hidden">
            <img v-if="avatarPreview" :src="avatarPreview" :alt="profile.nombre" class="w-full h-full object-cover" />
            <span v-else class="text-3xl font-semibold text-sky-400">{{ initials }}</span>
          </div>

          <h3 class="mt-5 text-xl font-semibold text-white truncate max-w-full">
            {{ profile.nombre || 'Tu nombre' }}
          </h3>
          <p class="text-sm text-slate-400 mt-1 truncate max-w-full">
            {{ profile.email }}
          </p>

          <span class="mt-4 inline-flex px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
            {{ profile.rol }}
          </span>
        </div>
      </div>

      <form class="lg:col-span-8 h-full rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col" @submit.prevent="saveProfile">
        <div class="space-y-5 flex-1">
          <BaseInput v-model="profile.nombre" label="Nombre visible" placeholder="Cómo quieres que te llamen" />
          <BaseInput v-model="profile.email" label="Correo electrónico" readonly />
          <BaseInput v-model="profile.logo" label="Foto o avatar (URL)" placeholder="https://..." />
        </div>
      </form>
    </div>
  </div>
</template>
