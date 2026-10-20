<script setup>
import { ref, computed, watch } from 'vue'
import { apiClient } from '../../services/api'

const isOpen = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['saved'])

const isSaving = ref(false)
const form = ref({ idUser: '', nombre: '', email: '', rol: 'USUARIO', logo: '' })

const roleOptions = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'APROBADOR', label: 'Aprobador' },
  { value: 'USUARIO', label: 'Usuario' }
]

const logoPreview = computed(() => {
  const url = (form.value.logo || '').trim()
  return /^https?:\/\//i.test(url) ? url : null
})

watch(isOpen, (open) => {
  if (open) {
    form.value = { idUser: '', nombre: '', email: '', rol: 'USUARIO', logo: '' }
  }
})

function close() {
  isOpen.value = false
}

async function save() {
  if (!form.value.nombre || !form.value.email) {
    return window.Swal?.fire('Atención', 'Nombre y email son obligatorios', 'warning')
  }
  isSaving.value = true
  try {
    await apiClient.post('add_user', {
      idUser: form.value.idUser || ('USR-' + Date.now().toString(36).toUpperCase()),
      nombre: form.value.nombre,
      email: form.value.email,
      rol: form.value.rol,
      logo: (form.value.logo || '').trim()
    })
    isOpen.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Usuario añadido',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
    emit('saved')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseModal v-model="isOpen" title="Nuevo Usuario" max-width="max-w-md">
    <div class="space-y-4">
      <BaseInput v-model="form.nombre" label="Nombre completo" placeholder="Ej. Juan Pérez" icon="fas fa-user" />
      <BaseInput v-model="form.email" label="Email" type="email" placeholder="correo@empresa.com" icon="fas fa-envelope" />
      <BaseInput v-model="form.idUser" label="ID (opcional)" placeholder="Se genera automático si se deja vacío" icon="fas fa-fingerprint" />
      <BaseSelect v-model="form.rol" label="Rol" :options="roleOptions" />
      <BaseInput v-model="form.logo" label="Avatar (URL)" placeholder="https://..." icon="fas fa-image" />
      <div
        v-if="logoPreview"
        class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block"
      >
        <img :src="logoPreview" alt="Preview" class="h-12 w-12 rounded-full object-cover" />
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="outline" @click="close">Cancelar</BaseButton>
        <BaseButton :is-loading="isSaving" icon="fas fa-save" @click="save">Guardar</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
