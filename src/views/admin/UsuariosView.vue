<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { hasPermission } from '../../composables/useAuth'
import UsuarioFormModal from './UsuarioFormModal.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import StatusBadge from '../../components/ui/StatusBadge.vue'

const isLoading = ref(true)
const users = ref([])
const showFormModal = ref(false)
const selectedUser = ref(null)

const columns = [
  { key: 'avatar', label: '', required: true },
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'email', label: 'Correo', required: true },
  { key: 'rol', label: 'Rol' },
  { key: 'estado', label: 'Estado', required: true }
]

async function fetchUsers() {
  isLoading.value = true
  try {
    const { data, error } = await supabase
      .from('whitelist')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    users.value = data || []
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

function handleFabUser() {
  openCreate()
}

onMounted(() => {
  fetchUsers()
  window.addEventListener('fab-add-user', handleFabUser)
})

onUnmounted(() => {
  window.removeEventListener('fab-add-user', handleFabUser)
})

function openCreate() {
  selectedUser.value = null
  showFormModal.value = true
}

function openEdit(user) {
  if (!hasPermission('gestionar_usuarios')) return
  selectedUser.value = user
  showFormModal.value = true
}

async function toggleStatus(user) {
  const next = String(user.estado).toLowerCase() === 'activo' ? 'Suspendido' : 'Activo'
  const result = await window.Swal?.fire({
    title: next === 'Activo' ? '¿Activar usuario?' : '¿Suspender usuario?',
    text: user.nombre,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: next === 'Activo' ? '#10b981' : '#ef4444'
  })
  if (!result?.isConfirmed) return

  try {
    const { error } = await supabase
      .from('whitelist')
      .update({ estado: next, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) throw error
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
    <DataTable
      :mobile-preview-count="3"
      :columns="columns"
      :data="users"
      :is-loading="isLoading"
      search-placeholder="Buscar usuario..."
      :filter-options="['Activo', 'Pendiente', 'Suspendido']"
      filter-column-key="estado"
      @row-click="openEdit"
    >
      <template #header-actions>
        <!-- En móvil el botón se resume a icono para no saturar -->
        <BaseButton
          v-if="hasPermission('gestionar_usuarios')"
          @click="openCreate"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </template>
          <span class="hidden sm:inline">Nuevo usuario</span>
        </BaseButton>
      </template>

      <template #cell-avatar="{ item }">
        <div class="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            v-if="item.logo"
            :src="item.logo"
            :alt="item.nombre"
            class="w-full h-full object-cover"
            @error="$event.target.style.display = 'none'"
          />
          <span v-else class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ initials(item.nombre) }}</span>
        </div>
      </template>

      <template #cell-rol="{ item }">
        <span class="text-xs text-slate-500">{{ item.rol }}</span>
      </template>

      <template #cell-estado="{ item }">
        <StatusBadge :status="item.estado" />
      </template>

      <template #actions="{ item }">
        <div v-if="hasPermission('gestionar_usuarios')" class="flex items-center gap-1 justify-end">
          <button
            type="button"
            class="p-1.5 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Editar"
            @click.stop="openEdit(item)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button
            type="button"
            class="p-1.5 rounded text-slate-400 hover:text-amber-500 transition-colors"
            :title="String(item.estado).toLowerCase() === 'activo' ? 'Suspender' : 'Activar'"
            @click.stop="toggleStatus(item)"
          >
            <svg v-if="String(item.estado).toLowerCase() === 'activo'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
            <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>
      </template>
    </DataTable>

    <UsuarioFormModal v-model="showFormModal" :user="selectedUser" @saved="fetchUsers" />
  </div>
</template>
