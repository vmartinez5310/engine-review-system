set -e

echo "=================================================="
echo ">>> INICIANDO FASE 1: Refactorización UI (DRY & KISS)"
echo "=================================================="

# 1. Crear el modal unificado de Usuario
cat << 'EOF' > src/views/admin/UsuarioFormModal.vue
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
EOF

# 2. Actualizar UsuariosView.vue para usar el modal consolidado
cat << 'EOF' > src/views/admin/UsuariosView.vue
<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import UsuarioFormModal from './UsuarioFormModal.vue'

const isLoading = ref(true)
const users = ref([])
const showFormModal = ref(false)
const selectedUser = ref(null)

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

function openCreate() {
  selectedUser.value = null
  showFormModal.value = true
}

function openEdit(user) {
  selectedUser.value = user
  showFormModal.value = true
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
          @click="openCreate"
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

    <UsuarioFormModal v-model="showFormModal" :user="selectedUser" @saved="fetchUsers" />
  </div>
</template>
EOF

rm -f src/views/admin/UsuarioAddModal.vue src/views/admin/UsuarioEditModal.vue

# 3. Crear ResenasTable.vue
cat << 'EOF' > src/views/core/ResenasTable.vue
<script setup>
import { computed } from 'vue'
import { hasPermission } from '../../composables/useAuth'

const props = defineProps({
  data: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['open-modal', 'row-click'])

const columns = computed(() => {
  const base = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'cliente', label: 'Cliente', required: true },
    { key: 'servicio', label: 'Servicio', hidden: true },
    { key: 'legalOk', label: 'LEGAL', hidden: true },
    { key: 'calificacion', label: 'Calif.', required: true },
    { key: 'comentario', label: 'Reseña' },
    { key: 'estado', label: 'Estado', required: true }
  ]
  if (hasPermission('editar_resena')) {
    base.push({ key: 'respuesta', label: 'Respuesta', hidden: true })
  }
  return base
})
</script>

<template>
  <SkeletonBlock v-if="isLoading" variant="table" :rows="6" />
  <DataTable
    v-else
    :mobile-preview-count="3"
    :columns="columns"
    :data="data"
    :is-loading="false"
    search-placeholder="Buscar en reseñas..."
    :filter-options="['Pendiente', 'Aprobado', 'Archivado']"
    filter-column-key="estado"
    @row-click="$emit('row-click', $event)"
  >
    <template #header-actions>
      <BaseButton
        v-if="hasPermission('generar_enlace')"
        icon="fas fa-plus"
        @click="$emit('open-modal')"
      >
        <span class="hidden sm:inline ml-1">Pedir Reseña</span>
      </BaseButton>
    </template>

    <template #cell-calificacion="{ item }">
      <BaseStarRating :score="Number(item.calificacion)" />
    </template>

    <template #cell-comentario="{ item }">
      <div class="max-w-[140px] 2xl:max-w-[240px] truncate text-slate-700 dark:text-slate-300">
        {{ item.comentario }}
      </div>
    </template>

    <template #cell-legalOk="{ item }">
      <div class="text-center">
        <i v-if="item.legalOk" class="fas fa-check-circle text-emerald-500"></i>
        <i v-else class="fas fa-minus text-slate-300"></i>
      </div>
    </template>

    <template #cell-respuesta="{ item }">
      <div
        v-if="item.respuesta"
        class="max-w-[140px] 2xl:max-w-[240px] truncate text-slate-700 dark:text-slate-300"
      >
        {{ item.respuesta }}
      </div>
      <span v-else class="text-slate-400 italic text-[11px]">Sin respuesta</span>
    </template>

    <template #cell-estado="{ item }">
      <StatusBadge :status="item.estado" />
    </template>
  </DataTable>
</template>
EOF

# 4. Crear SeguimientosTable.vue
cat << 'EOF' > src/views/core/SeguimientosTable.vue
<script setup>
import { hasPermission } from '../../composables/useAuth'

defineProps({
  data: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

defineEmits(['open-modal', 'row-click', 'revoke'])

const columns = [
  { key: 'id', label: 'ID', hidden: true },
  { key: 'fecha', label: 'Generado' },
  { key: 'cliente', label: 'Cliente', required: true },
  { key: 'servicio', label: 'Servicio' },
  { key: 'dias', label: 'Transcurrido' },
  { key: 'asesor', label: 'Asesor', hidden: true },
  { key: 'estado', label: 'Estado', required: true }
]

const filterOptions = ['Activo', 'Usado', 'Expirado', 'Revocado']
</script>

<template>
  <SkeletonBlock v-if="isLoading" variant="tokens" :rows="6" />
  <DataTable
    v-else
    :mobile-preview-count="3"
    :columns="columns"
    :data="data"
    :is-loading="false"
    search-placeholder="Buscar cliente o servicio..."
    :filter-options="filterOptions"
    filter-column-key="estado"
    @row-click="$emit('row-click', $event)"
  >
    <template #header-actions>
      <BaseButton
        v-if="hasPermission('generar_enlace')"
        icon="fas fa-plus"
        @click="$emit('open-modal')"
      >
        <span class="hidden sm:inline ml-1">Pedir Reseña</span>
      </BaseButton>
    </template>

    <template #cell-dias="{ item }">
      <span
        class="text-xs font-semibold tabular-nums"
        :class="
          item.estado === 'Expirado' || item.dias >= 7
            ? 'text-red-500 dark:text-red-400'
            : 'text-slate-600 dark:text-slate-400'
        "
      >
        {{ item.dias === 0 ? 'Hoy' : `${item.dias} días` }}
      </span>
    </template>

    <template #cell-estado="{ item }">
      <StatusBadge :status="item.estado" />
    </template>

    <template #actions="{ item }">
      <button
        v-if="item.estado === 'Activo' && hasPermission('editar_resena')"
        type="button"
        class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        title="Revocar enlace"
        @click.stop="$emit('revoke', item)"
      >
        <i class="fas fa-ban text-xs" />
      </button>
    </template>
  </DataTable>
</template>
EOF

# 5. Reescribir ResenasView.vue delegando la vista a los dos submódulos
cat << 'EOF' > src/views/core/ResenasView.vue
<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import ResenasTable from './ResenasTable.vue'
import SeguimientosTable from './SeguimientosTable.vue'
import GenerarResenaModal from './GenerarResenaModal.vue'
import GestionResenaModal from './GestionResenaModal.vue'

const props = defineProps({
  initialSubTab: { type: String, default: null }
})

const activeSubTab = ref('recibidas')
const isLoading = ref(true)
const reviews = ref([])
const tokens = ref([])

const showManageModal = ref(false)
const selectedReview = ref(null)

const showGenerateModal = ref(false)
const selectedToken = ref(null)

async function fetchData() {
  isLoading.value = true
  try {
    if (activeSubTab.value === 'recibidas') {
      reviews.value = await apiClient.post('get_dashboard_reviews')
    } else if (activeSubTab.value === 'por_evaluar') {
      tokens.value = await apiClient.post('get_tokens')
    }
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  let targetSub = props.initialSubTab
  if (!targetSub) {
    const params = new URLSearchParams(window.location.search)
    targetSub = params.get('subtab')
    if (targetSub) {
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl)
    }
  }

  if (targetSub === 'recibidas' || targetSub === 'por_evaluar') {
    if (activeSubTab.value !== targetSub) {
      activeSubTab.value = targetSub
      return
    }
  }
  fetchData()
})

watch(() => props.initialSubTab, (newSub) => {
  if (newSub === 'recibidas' || newSub === 'por_evaluar') {
    activeSubTab.value = newSub
  }
})

watch(activeSubTab, fetchData)

function openNewLinkModal() {
  selectedToken.value = null
  showGenerateModal.value = true
}

function handleReviewClick(row) {
  if (hasPermission('editar_resena')) {
    selectedReview.value = row
    showManageModal.value = true
  }
}

function handleTokenClick(row) {
  selectedToken.value = row
  showGenerateModal.value = true
}

function onGenerateSuccess() {
  if (activeSubTab.value === 'por_evaluar') fetchData()
}

async function revokeToken(item) {
  if (!hasPermission('editar_resena') || !item) return
  const result = await window.Swal?.fire({
    title: '¿Revocar enlace?',
    text: `Se inhabilitará el enlace de ${item.cliente}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444'
  })
  if (!result?.isConfirmed) return

  try {
    await apiClient.post('revoke_link', { fila: item.fila })
    item.estado = 'Revocado'
    showGenerateModal.value = false
    window.Swal?.fire({
      icon: 'success',
      title: 'Enlace revocado',
      toast: true,
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false
    })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <div class="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-full sm:w-fit shrink-0">
      <button
        type="button"
        :class="[
          'flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm',
          activeSubTab === 'recibidas'
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-none'
        ]"
        @click="activeSubTab = 'recibidas'"
      >
        Bandeja de Entrada
      </button>
      <button
        v-if="hasPermission('ver_seguimientos')"
        type="button"
        :class="[
          'flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm',
          activeSubTab === 'por_evaluar'
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-none'
        ]"
        @click="activeSubTab = 'por_evaluar'"
      >
        Por Evaluar
      </button>
    </div>

    <div class="flex-1 overflow-hidden flex flex-col relative">
      <Transition name="fade" mode="out-in">
        <div v-if="activeSubTab === 'recibidas'" key="recibidas" class="absolute inset-0 flex flex-col">
          <ResenasTable
            :data="reviews"
            :is-loading="isLoading"
            @open-modal="openNewLinkModal"
            @row-click="handleReviewClick"
          />
        </div>
        <div v-else-if="activeSubTab === 'por_evaluar'" key="por_evaluar" class="absolute inset-0 flex flex-col">
          <SeguimientosTable
            :data="tokens"
            :is-loading="isLoading"
            @open-modal="openNewLinkModal"
            @row-click="handleTokenClick"
            @revoke="revokeToken"
          />
        </div>
      </Transition>
    </div>

    <GestionResenaModal v-model="showManageModal" :review="selectedReview" @updated="fetchData" />
    <GenerarResenaModal
      v-model="showGenerateModal"
      :initial-token="selectedToken"
      @success="onGenerateSuccess"
      @revoke="revokeToken"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
EOF

echo ">>> Validando compilación con npm run build..."
npm run build

echo ">>> Guardando cambios de Fase 1 en Git..."
git add .
git commit -m "refactor(ui): consolidate user modals and decouple reviews views (Fase 1)"
git push origin HEAD || echo "[WARN] Verifica tu conexión remota para push"

rm run_fase1.sh

echo "=================================================="
echo ">>> FASE 1 COMPLETADA CON ÉXITO."
echo ">>> Puedes pausar aquí y probar localmente con 'npm run dev'."
echo "=================================================="
