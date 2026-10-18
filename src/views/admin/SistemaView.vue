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
  Color_Primario: '#4cc3e9',
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
      Color_Primario: data.color || '#4cc3e9',
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
  <div class="h-full w-full flex flex-col overflow-y-auto lg:overflow-hidden pb-4 lg:pb-1 select-none">
    
    <!-- HEADER COMPACTO -->
    <div class="shrink-0 flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-sky-400"></span>
          <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Parámetros Globales • Hoja: Configuración
          </span>
        </div>
        <div class="flex items-baseline gap-3 mt-0.5">
          <h2 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Configuración del Sistema
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 hidden md:inline-block">
            Identidad visual corporativa y dominio de operación
          </p>
        </div>
      </div>

      <!-- Acciones Superiores -->
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          @click="loadConfig"
          :disabled="isLoading || isSaving"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <i :class="['fas fa-sync-alt text-slate-400 text-xs', { 'animate-spin text-sky-400': isLoading }]"></i>
          <span class="hidden sm:inline">Recargar</span>
        </button>

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

    <!-- SKELETON BLOCK AL CARGAR -->
    <div v-if="isLoading" class="flex-1 min-h-0">
      <SkeletonBlock variant="bento" :rows="8" />
    </div>

    <!-- BENTO GRID SIN SCROLL (Ajustado matemáticamente al alto disponible) -->
    <div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5">
      
      <!-- COLUMNA IZQUIERDA (7 cols): IDENTIDAD CORPORATIVA Y ACTIVOS -->
      <div class="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-4 xl:p-5 flex flex-col justify-between gap-3 min-h-0 shadow-sm">
        
        <!-- Cabecera de tarjeta -->
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <i class="fas fa-palette text-xs"></i>
            </div>
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Identidad Visual
              </h3>
              <p class="text-[11px] text-slate-400 dark:text-slate-500">
                Nombre comercial, color de marca y logotipos
              </p>
            </div>
          </div>
          <span
            class="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400"
          >
            {{ form.Color_Primario }}
          </span>
        </div>

        <!-- Fila 1: Empresa + Selector de Color -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div class="sm:col-span-7">
            <BaseInput
              v-model="form.Empresa_Nombre"
              label="Nombre de la empresa"
              placeholder="Inmobiliarte 22"
              icon="fas fa-building"
            />
          </div>

          <div class="sm:col-span-5">
            <label class="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Color primario
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="form.Color_Primario"
                type="color"
                class="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent shrink-0"
              />
              <input
                v-model="form.Color_Primario"
                type="text"
                placeholder="#4CC3E9"
                class="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-mono uppercase text-slate-800 dark:text-white focus:ring-2 focus:ring-brand"
              />
            </div>
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
        <!-- Fila 2: Logo Horizontal + Vista Previa Lateral -->
        <div class="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex-1 min-w-0">
            <BaseInput
              v-model="form.Logo_Horizontal"
              label="Logo horizontal (URL)"
              placeholder="https://..."
              icon="fas fa-image"
            />
            <p class="text-[11px] text-slate-400 mt-1 truncate">
              URL pública para cabeceras y formularios.
            </p>
          </div>

          <div class="w-full sm:w-36 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-2 shrink-0 overflow-hidden">
            <img
              v-if="previewH"
              :src="previewH"
              alt="Logo Horizontal"
              class="max-h-full max-w-full object-contain"
              @error="$event.target.style.display = 'none'"
            />
            <span v-else class="text-[10px] text-slate-400">Sin vista previa</span>
          </div>
        </div>

        <!-- Fila 3: Logo Vertical / Icono + Vista Previa Lateral -->
        <div class="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex-1 min-w-0">
            <BaseInput
              v-model="form.Logo_Vertical"
              label="Logo vertical / icono (URL)"
              placeholder="https://..."
              icon="fas fa-icons"
            />
            <p class="text-[11px] text-slate-400 mt-1 truncate">
              Usado en sidebar colapsado, avatares e iconos.
            </p>
          </div>

          <div class="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-2 shrink-0 overflow-hidden self-center">
            <img
              v-if="previewV"
              :src="previewV"
              alt="Logo Vertical"
              class="max-h-full max-w-full object-contain"
              @error="$event.target.style.display = 'none'"
            />
            <i v-else class="fas fa-cube text-slate-500 text-sm"></i>
          </div>
        </div>

      </div>

      <!-- COLUMNA DERECHA (5 cols): ENRUTAMIENTO + LIVE PREVIEW DE MARCA -->
      <div class="lg:col-span-5 flex flex-col gap-3.5 min-h-0">
        
        <!-- Tarjeta Superior: Aplicación y Enlaces -->
        <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-4 xl:p-5 flex flex-col justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            <div class="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <i class="fas fa-globe text-xs"></i>
            </div>
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Aplicación y Dominio
              </h3>
              <p class="text-[11px] text-slate-400 dark:text-slate-500">
                Base para enlaces únicos de clientes
              </p>
            </div>
          </div>

          <div>
            <BaseInput
              v-model="form.URL_Frontend_App"
              label="URL Frontend App"
              placeholder="https://inmobiliarte22.com.mx/resenas"
              icon="fas fa-link"
            />
            <p class="text-[11px] text-slate-400 mt-1">
              Base usada para generar los enlaces únicos de reseña. Sin barra final.
            </p>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
            <div class="min-w-0">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Formato de invitación generado
              </span>
              <span class="text-xs font-mono text-sky-400 truncate block mt-0.5">
                {{ form.URL_Frontend_App || 'https://tudominio.com' }}/?t=TOKEN_CLIENTE
              </span>
            </div>
            <i class="fas fa-check-circle text-emerald-400 text-sm shrink-0"></i>
          </div>
        </div>

        <!-- Tarjeta Inferior: Simulación Interactiva de Identidad -->
        <div class="flex-1 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-4 xl:p-5 flex flex-col justify-between gap-3 relative overflow-hidden shadow-sm min-h-0">
          <div
            class="absolute -right-8 -bottom-8 w-36 h-36 rounded-full blur-3xl opacity-15 pointer-events-none"
            :style="{ backgroundColor: form.Color_Primario || '#4cc3e9' }"
          ></div>

          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vista Previa en Portal Público
            </span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Tiempo Real
            </span>
          </div>

          <!-- Tarjeta Mockup del Portal de Reseñas -->
          <div class="my-auto p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3 shadow-inner">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                <img
                  v-if="previewV || previewH"
                  :src="previewV || previewH"
                  alt="Preview"
                  class="max-h-full max-w-full object-contain"
                />
                <i v-else class="fas fa-building text-slate-500 text-sm"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-white truncate">
                  {{ form.Empresa_Nombre || 'Inmobiliarte 22' }}
                </p>
                <div class="flex items-center gap-1 mt-0.5">
                  <i v-for="s in 5" :key="s" class="fas fa-star text-[10px] text-amber-400"></i>
                  <span class="text-[10px] text-slate-400 ml-1">Portal verificado</span>
                </div>
              </div>
            </div>

            <span
              class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 shrink-0 shadow-sm"
              :style="{ backgroundColor: form.Color_Primario || '#4cc3e9' }"
            >
              Calificar
            </span>
          </div>

          <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Variable CSS: <code class="text-slate-300">--brand-color</code></span>
            <span class="font-mono text-slate-300 uppercase">{{ form.Color_Primario }}</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>