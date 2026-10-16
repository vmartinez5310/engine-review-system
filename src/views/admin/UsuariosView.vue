<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'

const isLoading = ref(true)
const users = ref([])
const showAddModal = ref(false)
const isSaving = ref(false)

const form = ref({ idUser: '', nombre: '', email: '', rol: 'USUARIO' })

const columns = [
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'rol', label: 'Rol' },
  { key: 'estado', label: 'Estado', required: true }
]

const roleOptions = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'APROBADOR', label: 'Aprobador' },
  { value: 'USUARIO', label: 'Usuario' }
]

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
  form.value = { idUser: '', nombre: '', email: '', rol: 'USUARIO' }
  showAddModal.value = true
}

async function saveUser() {
  if (!form.value.nombre || !form.value.email) {
    return window.Swal?.fire('Atencion', 'Nombre y email son obligatorios', 'warning')
  }
  isSaving.value = true
  try {
    await apiClient.post('add_user', {
      idUser: form.value.idUser || ('USR-' + Date.now().toString(36).toUpperCase()),
      nombre: form.value.nombre,
      email: form.value.email,
      rol: form.value.rol
    })
    showAddModal.value = false
    window.Swal?.fire({ icon: 'success', title: 'Usuario anadido', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
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
    title: next === 'Activo' ? 'Activar usuario?' : 'Suspender usuario?',
    text: user.nombre,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: next === 'Activo' ? '#10b981' : '#ef4444'
  })
  if (!result?.isConfirmed) return
  try {
    await apiClient.post('update_user', { fila: user.fila, estado: next })
    user.estado = next
    window.Swal?.fire({ icon: 'success', title: 'Estado actualizado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}

function handleRowClick(row) {
  if (hasPermission('gestionar_usuarios')) toggleStatus(row)
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <DataTable
      :columns="columns"
      :data="users"
      :is-loading="isLoading"
      search-placeholder="Buscar usuario..."
      :filter-options="['Activo', 'Pendiente', 'Suspendido']"
      filter-column-key="estado"
      @row-click="handleRowClick"
    >
      <template #header-actions>
        <BaseButton v-if="hasPermission('gestionar_usuarios')" icon="fas fa-user-plus" @click="openAdd">
          <span class="hidden sm:inline ml-1">Anadir Usuario</span>
        </BaseButton>
      </template>

      <template #cell-estado="{ item }">
        <StatusBadge :status="item.estado" />
      </template>

      <template #cell-rol="{ item }">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ item.rol }}</span>
      </template>
    </DataTable>

    <BaseModal v-model="showAddModal" title="Nuevo Usuario" max-width="max-w-md">
      <div class="space-y-4">
        <BaseInput v-model="form.nombre" label="Nombre completo" placeholder="Ej. Juan Perez" icon="fas fa-user" />
        <BaseInput v-model="form.email" label="Email" type="email" placeholder="correo@empresa.com" icon="fas fa-envelope" />
        <BaseInput v-model="form.idUser" label="ID (opcional)" placeholder="Se genera automatico si se deja vacio" icon="fas fa-fingerprint" />
        <BaseSelect v-model="form.rol" label="Rol" :options="roleOptions" icon="fas fa-shield-alt" />
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="showAddModal = false">Cancelar</BaseButton>
        <BaseButton :is-loading="isSaving" icon="fas fa-save" @click="saveUser">Guardar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
