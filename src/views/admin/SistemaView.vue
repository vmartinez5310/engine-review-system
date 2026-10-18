<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'

const activeTab = ref('tokens')
const isLoading = ref(true)
const isSaving = ref(false)
const tokens = ref([])

const form = ref({
  Empresa_Nombre: '',
  Color_Primario: '#334155',
  Logo_Horizontal: '',
  Logo_Vertical: '',
  URL_Frontend_App: ''
})

const tokenColumns = [
  { key: 'fecha', label: 'Fecha', required: true },
  { key: 'cliente', label: 'Cliente', required: true },
  { key: 'servicio', label: 'Servicio/Zona' },
  { key: 'asesor', label: 'Asesor' },
  { key: 'estado', label: 'Estado', required: true },
  { key: 'id', label: 'ID' }
]

const previewH = computed(() => {
  const u = (form.value.Logo_Horizontal || '').trim()
  return /^https?:\/\//i.test(u) ? u : null
})
const previewV = computed(() => {
  const u = (form.value.Logo_Vertical || '').trim()
  return /^https?:\/\//i.test(u) ? u : null
})

async function loadTokens() {
  isLoading.value = true
  try {
    tokens.value = await apiClient.post('get_tokens')
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

async function loadConfig() {
  isLoading.value = true
  try {
    const data = await apiClient.post('get_public_config')
    form.value = {
      Empresa_Nombre: data.nombre || '',
      Color_Primario: data.color || '#334155',
      Logo_Horizontal: data.logoH || '',
      Logo_Vertical: data.logoV || '',
      URL_Frontend_App: data.urlFrontend || ''
    }
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

async function loadTab(tab) {
  activeTab.value = tab
  if (tab === 'tokens') await loadTokens()
  else await loadConfig()
}

onMounted(() => loadTokens())

async function saveConfig() {
  if (!hasPermission('configurar_sistema')) return
  isSaving.value = true
  try {
    await apiClient.post('update_config', { configuracion: form.value })
    document.documentElement.style.setProperty('--brand-color', form.value.Color_Primario)
    window.Swal?.fire({
      icon: 'success',
      title: 'Configuración guardada',
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

async function revokeToken(row) {
  const result = await window.Swal?.fire({
    title: '¿Revocar enlace?',
    text: row.cliente || row.id,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444'
  })
  if (!result?.isConfirmed) return
  try {
    await apiClient.post('revoke_link', { fila: row.fila })
    row.estado = 'Revocado'
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
    <div class="flex gap-2 shrink-0">
      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
          activeTab === 'tokens'
            ? 'bg-brand text-white shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        ]"
        @click="loadTab('tokens')"
      >
        Enlaces generados
      </button>
      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
          activeTab === 'config'
            ? 'bg-brand text-white shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        ]"
        @click="loadTab('config')"
      >
        Identidad
      </button>
    </div>

    <template v-if="activeTab === 'tokens'">
      <SkeletonBlock v-if="isLoading" variant="table" :rows="6" />
      <DataTable
        v-else
        :columns="tokenColumns"
        :data="tokens"
        :is-loading="false"
        search-placeholder="Buscar enlace..."
        :filter-options="['Activo', 'Usado', 'Expirado', 'Revocado']"
        filter-column-key="estado"
      >
        <template #cell-estado="{ item }">
          <StatusBadge :status="item.estado" />
        </template>
        <template #cell-id="{ item }">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-slate-500">{{ item.id }}</span>
            <button
              v-if="item.estado === 'Activo' || item.estado === 'Expirado'"
              type="button"
              class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              title="Revocar"
              @click.stop="revokeToken(item)"
            >
              <i class="fas fa-ban text-xs"></i>
            </button>
          </div>
        </template>
      </DataTable>
    </template>

    <div v-else class="h-full overflow-y-auto">
      <SkeletonBlock v-if="isLoading" variant="form" :rows="5" />
      <div v-else class="max-w-2xl mx-auto space-y-6 pb-10">
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">Identidad visual</h3>
          <BaseInput v-model="form.Empresa_Nombre" label="Nombre de la empresa" placeholder="Inmobiliarte 22" icon="fas fa-building" />
          <div>
            <label class="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Color primario</label>
            <div class="flex items-center gap-3">
              <input v-model="form.Color_Primario" type="color" class="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent" />
              <input v-model="form.Color_Primario" type="text" class="flex-1 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:ring-2 focus:ring-brand" placeholder="#334155" />
            </div>
          </div>
          <div>
            <BaseInput v-model="form.Logo_Horizontal" label="Logo horizontal (URL)" placeholder="https://..." icon="fas fa-image" />
            <div v-if="previewH" class="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block">
              <img :src="previewH" alt="Logo H" class="h-12 object-contain max-w-[180px]" @error="$event.target.style.display='none'" />
            </div>
          </div>
          <div>
            <BaseInput v-model="form.Logo_Vertical" label="Logo vertical / icono (URL)" placeholder="https://..." icon="fas fa-icons" />
            <div v-if="previewV" class="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block">
              <img :src="previewV" alt="Logo V" class="h-12 w-12 object-contain" @error="$event.target.style.display='none'" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">Aplicación</h3>
          <BaseInput
            v-model="form.URL_Frontend_App"
            label="URL Frontend App"
            placeholder="https://tudominio.com"
            icon="fas fa-link"
          />
          <p class="text-xs text-slate-400 -mt-3">Base usada para generar los enlaces únicos de reseña. Sin barra final.</p>
        </div>

        <div class="flex justify-end">
          <BaseButton
            v-if="hasPermission('configurar_sistema')"
            :is-loading="isSaving"
            icon="fas fa-save"
            @click="saveConfig"
          >
            Guardar configuración
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
