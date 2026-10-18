<script setup>
import { ref, computed, watch } from 'vue'
import { apiClient } from '../../services/api'

const isOpen = defineModel({ type: Boolean, default: false })
const props = defineProps({
  user: { type: Object, default: null }
})
const emit = defineEmits(['saved'])

const isSaving = ref(false)
const form = ref({ nombre: '', rol: 'USUARIO', logo: '', estado: 'Activo' })

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
  () => [isOpen.value, props.user],
  ([open]) => {
    if (open && props.user) {
      form.value = {
        nombre: props.user.nombre || '',
        rol: (props.user.rol || 'USUARIO').toUpperCase(),
        logo: props.user.logo || '',
        estado: props.user.estado || 'Activo'
      }
    }
  }
)

function close() {
  isOpen.value = false
}

async function save() {
  if (!props.user) return
  if (!form.value.nombre?.trim()) {
    return window.Swal?.fire('Atención', 'El nombre es obligatorio', 'warning')
  }
  isSaving.value = true
  try {
    await apiClient.post('update_user', {
      fila: props.user.fila,
      nombre: form.value.nombre.trim(),
      rol: form.value.rol,
      logo: (form.value.logo || '').trim(),
      estado: form.value.estado
    })
    isOpen.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Usuario actualizado',
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
  <BaseModal v-model="isOpen" title="Editar Usuario" max-width="max-w-md">
    <div class="space-y-4">
      <BaseInput v-model="form.nombre" label="Nombre" placeholder="Nombre completo" icon="fas fa-user" />
      <BaseSelect v-model="form.rol" label="Rol" :options="roleOptions" />
      <BaseSelect v-model="form.estado" label="Estado" :options="estadoOptions" />
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
