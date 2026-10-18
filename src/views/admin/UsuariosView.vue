<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'

const isLoading = ref(true)
const users = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const isSaving = ref(false)
const editing = ref(null)

const form = ref({ idUser: '', nombre: '', email: '', rol: 'USUARIO', logo: '' })
const editForm = ref({ nombre: '', rol: 'USUARIO', logo: '', estado: 'Activo' })

const columns = [
  { key: 'avatar', label: '', required: true },
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'rol', label: 'Rol' },
  { key: 'estado', label: 'Estado', required: true },
  { key: 'acciones', label: '', required: true }
]

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

const editLogoPreview = computed(() => {
  const url = (editForm.value.logo || '').trim()
  return /^https?:\/\//i.test(url) ? url : null
})

async function fetchUsers() {
  isLoading.value = true
  try {
    users.value = await apiClient.post('get_users')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchUsers)

function openAdd() {
  form.value = { idUser: '', nombre: '', email: '', rol: 'USUARIO', logo: '' }
  showAddModal.value = true
}

function openEdit(user) {
  editing.value = user
  editForm.value = {
    nombre: user.nombre || '',
    rol: (user.rol || 'USUARIO').toUpperCase(),
    logo: user.logo || '',
    estado: user.estado || 'Activo'
  }
  showEditModal.value = true
}

async function saveUser() {
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
    showAddModal.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Usuario añadido',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
    await fetchUsers()
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}

async function saveEdit() {
  if (!editing.value) return
  if (!editForm.value.nombre?.trim()) {
    return window.Swal?.fire('Atención', 'El nombre es obligatorio', 'warning')
  }
  isSaving.value = true
  try {
    await apiClient.post('update_user', {
      fila: editing.value.fila,
      nombre: editForm.value.nombre.trim(),
      rol: editForm.value.rol,
      logo: (editForm.value.logo || '').trim(),
      estado: editForm.value.estado
    })
    showEditModal.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Usuario actualizado',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    })
    await fetchUsers()
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}

async function toggleStatus(user) {
  const next = String(user.estado).toUpperCase() === 'ACTIVO' ? 'Suspendido' : 'Activo'
  const result = await window.Swal?.fire({
    title: next === 'Activo' ? '¿Activar usuario?' : '¿Suspender usuario?',
    text: user.nombre,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: next === 'Activo' ? '#10b981' : '#ef4444'
  })
  if (!result?.isConfirmed) return
  try {
    await apiClient.post('update_user', { fila: user.fila, estado: next })
    user.estado = next
    window.Swal?.fire({
      icon: 'success',
      title: 'Estado actualizado',
      toast: true,
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

function initials(name) {
  return (name || 'U').substring(0, 2).toUpperCase()
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <SkeletonBlock v-if="isLoading" variant="table" :rows="6" />

    <DataTable
      v-else
      :columns="columns"
      :data="users"
      :is-loading="false"
      search-placeholder="Buscar usuario..."
      :filter-options="['Activo', 'Pendiente', 'Suspendido']"
      filter-column-key="estado"
    >
      <template #header-actions>
        <BaseButton v-if="hasPermission('gestionar_usuarios')" icon="fas fa-user-plus" @click="openAdd">
          <span class="hidden sm:inline ml-1">Añadir Usuario</span>
        </BaseButton>
      </template>

      <template #cell-avatar="{ item }">
        <div class="w-9 h-9 rounded-full overflow-hidden bg-brand/10 flex items-center justify-center shrink-0">
          <img
            v-if="item.logo"
            :src="item.logo"
            :alt="item.nombre"
            class="w-full h-full object-cover"
            @error="$event.target.style.display = 'none'"
          />
          <span v-else class="text-xs font-bold text-brand">{{ initials(item.nombre) }}</span>
        </div>
      </template>

      <template #cell-estado="{ item }">
        <StatusBadge :status="item.estado" />
      </template>

      <template #cell-rol="{ item }">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ item.rol }}</span>
      </template>

      <template #cell-acciones="{ item }">
        <div v-if="hasPermission('gestionar_usuarios')" class="flex items-center gap-1">
          <button
            type="button"
            class="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
            title="Editar"
            @click.stop="openEdit(item)"
          >
            <i class="fas fa-pen text-xs"></i>
          </button>
          <button
            type="button"
            class="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
            :title="String(item.estado).toUpperCase() === 'ACTIVO' ? 'Suspender' : 'Activar'"
            @click.stop="toggleStatus(item)"
          >
            <i :class="String(item.estado).toUpperCase() === 'ACTIVO' ? 'fas fa-user-slash' : 'fas fa-user-check'" class="text-xs"></i>
          </button>
        </div>
      </template>
    </DataTable>

    <BaseModal v-model="showAddModal" title="Nuevo Usuario" max-width="max-w-md">
      <div class="space-y-4">
        <BaseInput v-model="form.nombre" label="Nombre completo" placeholder="Ej. Juan Pérez" icon="fas fa-user" />
        <BaseInput v-model="form.email" label="Email" type="email" placeholder="correo@empresa.com" icon="fas fa-envelope" />
        <BaseInput v-model="form.idUser" label="ID (opcional)" placeholder="Se genera automático si se deja vacío" icon="fas fa-fingerprint" />
        <BaseSelect v-model="form.rol" label="Rol" :options="roleOptions" />
        <BaseInput v-model="form.logo" label="Avatar (URL)" placeholder="https://..." icon="fas fa-image" />
        <div v-if="logoPreview" class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block">
          <img :src="logoPreview" alt="Preview" class="h-12 w-12 rounded-full object-cover" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" @click="showAddModal = false">Cancelar</BaseButton>
          <BaseButton :is-loading="isSaving" icon="fas fa-save" @click="saveUser">Guardar</BaseButton>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-model="showEditModal" title="Editar Usuario" max-width="max-w-md">
      <div class="space-y-4">
        <BaseInput v-model="editForm.nombre" label="Nombre" placeholder="Nombre completo" icon="fas fa-user" />
        <BaseSelect v-model="editForm.rol" label="Rol" :options="roleOptions" />
        <BaseSelect
          v-model="editForm.estado"
          label="Estado"
          :options="[
            { value: 'Activo', label: 'Activo' },
            { value: 'Pendiente', label: 'Pendiente' },
            { value: 'Suspendido', label: 'Suspendido' }
          ]"
        />
        <BaseInput v-model="editForm.logo" label="Avatar (URL)" placeholder="https://..." icon="fas fa-image" />
        <div v-if="editLogoPreview" class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block">
          <img :src="editLogoPreview" alt="Preview" class="h-12 w-12 rounded-full object-cover" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" @click="showEditModal = false">Cancelar</BaseButton>
          <BaseButton :is-loading="isSaving" icon="fas fa-save" @click="saveEdit">Guardar</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
