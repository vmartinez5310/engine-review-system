<script setup>
import { ref, computed, onMounted } from 'vue'
import { authState } from '../../composables/useAuth'
import { apiClient } from '../../services/api'

const isLoading = ref(true)
const isSaving = ref(false)
const form = ref({ nombre: '', logo: '' })

const user = computed(() => authState.user || {})

const initials = computed(() => {
  const n = form.value.nombre || user.value.nombre || 'U'
  return n.substring(0, 2).toUpperCase()
})

const avatarUrl = computed(() => {
  const u = (form.value.logo || '').trim()
  return /^https?:\/\//i.test(u) ? u : null
})

onMounted(() => {
  form.value = {
    nombre: user.value.nombre || '',
    logo: user.value.logo || ''
  }
  isLoading.value = false
})

async function save() {
  if (!form.value.nombre?.trim()) {
    return window.Swal?.fire('Atención', 'El nombre es obligatorio', 'warning')
  }
  isSaving.value = true
  try {
    const res = await apiClient.post('update_profile', {
      nombre: form.value.nombre.trim(),
      logo: (form.value.logo || '').trim()
    })
    if (authState.user) {
      authState.user.nombre = res.nombre ?? form.value.nombre.trim()
      authState.user.logo = res.logo ?? (form.value.logo || '').trim()
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
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-lg mx-auto pb-10">
      <SkeletonBlock v-if="isLoading" variant="form" :rows="4" />

      <div
        v-else
        class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
      >
        <div class="bg-brand/10 dark:bg-brand/5 px-6 py-8 flex flex-col items-center gap-3">
          <div
            class="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-white dark:ring-slate-800 overflow-hidden"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="form.nombre"
              class="w-full h-full object-cover"
              @error="$event.target.style.display = 'none'"
            />
            <template v-else>{{ initials }}</template>
          </div>
          <div class="text-center">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white">{{ form.nombre || 'Usuario' }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ user.email }}</p>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <BaseInput
            v-model="form.nombre"
            label="Nombre"
            placeholder="Tu nombre completo"
            icon="fas fa-user"
          />
          <BaseInput
            v-model="form.logo"
            label="Avatar (URL)"
            placeholder="https://..."
            icon="fas fa-image"
          />
          <p class="text-[11px] text-slate-400 -mt-2">URL pública de imagen. Se muestra en el menú y listados.</p>

          <div class="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700/50">
            <span class="text-sm text-slate-500">Rol</span>
            <span class="text-sm font-semibold uppercase tracking-wide text-brand">{{ user.rol || 'USUARIO' }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
            <span class="text-sm text-slate-500">Estado</span>
            <StatusBadge :status="user.estado || 'Activo'" />
          </div>

          <div class="pt-2 flex justify-end">
            <BaseButton :is-loading="isSaving" icon="fas fa-save" @click="save">
              Guardar cambios
            </BaseButton>
          </div>

          <p class="text-xs text-slate-400 text-center leading-relaxed pt-2">
            El acceso se realiza mediante OTP. El rol solo puede cambiarlo un administrador.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
