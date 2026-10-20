<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import UsuarioAddModal from './UsuarioAddModal.vue'
import UsuarioEditModal from './UsuarioEditModal.vue'

const isLoading = ref(true)
const users = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const editing = ref(null)

const columns = [
  { key: 'avatar', label: '', required: true },
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'rol', label: 'Rol' },
  { key: 'estado', label: 'Estado', required: true }
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

function openEdit(user) {
  editing.value = user
  showEditModal.value = true
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
      :mobile-preview-count="3"
      :columns="columns"
      :data="users"
      :is-loading="false"
      search-placeholder="Buscar usuario..."
      :filter-options="['Activo', 'Pendiente', 'Suspendido']"
      filter-column-key="estado"
    >
      <template #header-actions>
        <BaseButton
          v-if="hasPermission('gestionar_usuarios')"
          icon="fas fa-user-plus"
          @click="showAddModal = true"
        >
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

      <template #cell-rol="{ item }">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ item.rol }}</span>
      </template>

      <template #cell-estado="{ item }">
        <StatusBadge :status="item.estado" />
      </template>

      <template #actions="{ item }">
        <div v-if="hasPermission('gestionar_usuarios')" class="flex items-center gap-1 justify-end">
          <button
            type="button"
            class="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
            title="Editar"
            @click.stop="openEdit(item)"
          >
            <i class="fas fa-pen text-xs" />
          </button>
          <button
            type="button"
            class="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
            :title="String(item.estado).toUpperCase() === 'ACTIVO' ? 'Suspender' : 'Activar'"
            @click.stop="toggleStatus(item)"
          >
            <i
              :class="String(item.estado).toUpperCase() === 'ACTIVO' ? 'fas fa-user-slash' : 'fas fa-user-check'"
              class="text-xs"
            />
          </button>
        </div>
      </template>
    </DataTable>

    <UsuarioAddModal v-model="showAddModal" @saved="fetchUsers" />
    <UsuarioEditModal v-model="showEditModal" :user="editing" @saved="fetchUsers" />
  </div>
</template>
