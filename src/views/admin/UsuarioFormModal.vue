<script setup>
import { ref, computed, watch } from 'vue'
import { apiClient } from '../../services/api'

const isOpen = defineModel({ type: Boolean, default: false })
const props = defineProps({
  user: { type: Object, default: null }
})
const emit = defineEmits(['saved'])

const isSaving = ref(false)
const isEdit = computed(() => !!props.user)

const form = ref({
  idUser: '',
  nombre: '',
  email: '',
  rol: 'USUARIO',
  estado: 'Activo',
  logo: ''
})

const roleOptions = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'APROBADOR', label: 'Aprobador' },
  { value: 'USUARIO', label: 'Usuario' }
]

const estadoOptions = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Suspendido', label: 'Suspendido' }
]

const logoPreview = computed(() => {
  const url = (form.value.logo || '').trim()
  return /^https?:\/\//i.test(url) ? url : null
})

watch(
  [isOpen, () => props.user],
  ([open, user]) => {
    if (!open) return
    if (user) {
      form.value = {
        idUser: user.id || user.UserId || '',
        nombre: user.nombre || '',
        email: user.email || '',
        rol: (user.rol || 'USUARIO').toUpperCase(),
        estado: user.estado || 'Activo',
        logo: user.logo || ''
      }
    } else {
      form.value = {
        idUser: '',
        nombre: '',
        email: '',
        rol: 'USUARIO',
        estado: 'Activo',
        logo: ''
      }
    }
  },
  { immediate: true }
)

function close() {
  isOpen.value = false
}

async function save() {
  if (!form.value.nombre?.trim() || (!isEdit.value && !form.value.email?.trim())) {
    return window.Swal?.fire('Atención', 'Nombre y correo son obligatorios', 'warning')
  }

  isSaving.value = true
  try {
    if (isEdit.value) {
      await apiClient.post('update_user', {
        fila: props.user.fila,
        nombre: form.value.nombre.trim(),
        rol: form.value.rol,
        logo: (form.value.logo || '').trim(),
        estado: form.value.estado
      })
    } else {
      await apiClient.post('add_user', {
        idUser: form.value.idUser.trim() || ('USR-' + Date.now().toString(36).toUpperCase()),
        nombre: form.value.nombre.trim(),
        email: form.value.email.trim(),
        rol: form.value.rol,
        logo: (form.value.logo || '').trim()
      })
    }

    isOpen.value = false
    window.Swal?.fire({
      icon: 'success',
      title: isEdit.value ? 'Usuario actualizado' : 'Usuario añadido',
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
  <BaseModal v-model="isOpen" :title="isEdit ? 'Editar Usuario' : 'Nuevo Usuario'" max-width="max-w-md">
    <div class="space-y-4">
      <BaseInput v-model="form.nombre" label="Nombre completo" placeholder="Ej. Juan Pérez" icon="fas fa-user" />
      <BaseInput
        v-if="!isEdit"
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="correo@empresa.com"
        icon="fas fa-envelope"
      />
      <BaseInput
        v-if="!isEdit"
        v-model="form.idUser"
        label="ID (opcional)"
        placeholder="Generado automáticamente si se omite"
        icon="fas fa-fingerprint"
      />
      <BaseSelect v-model="form.rol" label="Rol" :options="roleOptions" />
      <BaseSelect v-if="isEdit" v-model="form.estado" label="Estado" :options="estadoOptions" />
      <BaseInput v-model="form.logo" label="Avatar / Logo (URL)" placeholder="https://..." icon="fas fa-image" />

      <div
        v-if="logoPreview"
        class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block"
      >
        <img :src="logoPreview" alt="Preview" class="h-12 w-12 rounded-full object-cover" />
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="outline" @click="close">Cancelar</BaseButton>
        <BaseButton :is-loading="isSaving" icon="fas fa-save" @click="save">
          {{ isEdit ? 'Guardar Cambios' : 'Registrar' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
