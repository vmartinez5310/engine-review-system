<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'
import SkeletonBlock from '../../components/ui/SkeletonBlock.vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) }
})

const isLoading = ref(true)
const isSaving = ref(false)

const form = ref({
  Empresa_Nombre: '',
  Color_Primario: '#4cc3e9',
  Logo_Horizontal: '',
  Logo_Vertical: '',
  URL_Frontend_App: ''
})

const previewH = computed(() => {
  const u = (form.value.Logo_Horizontal || '').trim()
  return /^https?:\/\//i.test(u) ? u : null
})

const previewV = computed(() => {
  const u = (form.value.Logo_Vertical || '').trim()
  return /^https?:\/\//i.test(u) ? u : null
})

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

onMounted(loadConfig)

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
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-y-auto lg:overflow-hidden pb-6 lg:pb-2 select-none">
    
    <!-- HEADER EJECUTIVO UNIFICADO -->
    <div class="shrink-0 flex flex-wrap items-center justify-between gap-4 pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span class="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {{ form.Empresa_Nombre || props.config?.nombre || 'Parámetros Globales' }} • Configuración
          </span>
        </div>
        <div class="flex items-baseline gap-3 mt-0.5">
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Identidad corporativa y enrutamiento
          </h2>
        </div>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          :disabled="isLoading || isSaving"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          @click="loadConfig"
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
          Guardar cambios
        </BaseButton>
      </div>
    </div>

    <!-- SKELETON EXACTO -->
    <div v-if="isLoading" class="flex-1 min-h-0">
      <SkeletonBlock variant="sistema" />
    </div>

    <!-- BENTO GRID DE CONFIGURACIÓN (ZERO-SCROLL EN DESKTOP) -->
    <div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      <!-- COLUMNA IZQUIERDA (7 cols): IDENTIDAD DE MARCA Y ACTIVOS -->
      <div class="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-5 flex flex-col justify-between gap-3.5 shadow-sm min-h-0">
        
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <i class="fas fa-palette text-xs"></i>
            </div>
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Identidad Visual
              </h3>
              <p class="text-[11px] text-slate-400 dark:text-slate-500">
                Marca comercial, color de acento y logotipos
              </p>
            </div>
          </div>
          <span class="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
            {{ form.Color_Primario }}
          </span>
        </div>

        <!-- Nombre + Color -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
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
                class="w-full p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm font-mono uppercase text-slate-800 dark:text-white focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        <!-- Logo Horizontal con Preview integrado -->
        <div class="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex-1 min-w-0">
            <BaseInput
              v-model="form.Logo_Horizontal"
              label="Logo horizontal (URL)"
              placeholder="https://..."
              icon="fas fa-image"
            />
          </div>
          <div class="w-full sm:w-36 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-2 shrink-0 overflow-hidden">
            <img
              v-if="previewH"
              :src="previewH"
              alt="Logo H"
              class="max-h-full max-w-full object-contain"
              @error="$event.target.style.display = 'none'"
            />
            <span v-else class="text-[10px] text-slate-400">Sin vista previa</span>
          </div>
        </div>

        <!-- Logo Vertical con Preview integrado -->
        <div class="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex-1 min-w-0">
            <BaseInput
              v-model="form.Logo_Vertical"
              label="Logo vertical / icono (URL)"
              placeholder="https://..."
              icon="fas fa-icons"
            />
          </div>
          <div class="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-2 shrink-0 overflow-hidden self-center">
            <img
              v-if="previewV"
              :src="previewV"
              alt="Logo V"
              class="max-h-full max-w-full object-contain"
              @error="$event.target.style.display = 'none'"
            />
            <i v-else class="fas fa-cube text-slate-500 text-xs"></i>
          </div>
        </div>

      </div>

      <!-- COLUMNA DERECHA (5 cols): DOMINIO + PREVIEW INTERACTIVO -->
      <div class="lg:col-span-5 flex flex-col gap-4 min-h-0">
        
        <!-- Enrutamiento -->
        <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-5 flex flex-col justify-between gap-3.5 shadow-sm">
          <div class="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div class="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <i class="fas fa-globe text-xs"></i>
            </div>
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Dominio de Aplicación
              </h3>
              <p class="text-[11px] text-slate-400 dark:text-slate-500">
                Base para enlaces únicos de reseñas
              </p>
            </div>
          </div>

          <BaseInput
            v-model="form.URL_Frontend_App"
            label="URL Frontend App"
            placeholder="https://inmobiliarte22.com.mx/resenas"
            icon="fas fa-link"
          />

          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
            <div class="min-w-0">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estructura de invitación
              </span>
              <span class="text-xs font-mono text-sky-400 truncate block mt-0.5">
                {{ form.URL_Frontend_App || 'https://tudominio.com' }}/?t=TOKEN
              </span>
            </div>
            <i class="fas fa-check-circle text-emerald-400 text-sm shrink-0"></i>
          </div>
        </div>

        <!-- Simulación en vivo -->
        <div class="flex-1 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-5 flex flex-col justify-between gap-3 relative overflow-hidden shadow-sm min-h-0">
          <div
            class="absolute -right-8 -bottom-8 w-36 h-36 rounded-full blur-3xl opacity-15 pointer-events-none"
            :style="{ backgroundColor: form.Color_Primario || '#4cc3e9' }"
          ></div>

          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Previsualización de Marca
            </span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Preview
            </span>
          </div>

          <div class="my-auto p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3 shadow-inner">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                <img
                  v-if="previewV || previewH"
                  :src="previewV || previewH"
                  alt="Logo"
                  class="max-h-full max-w-full object-contain"
                />
                <i v-else class="fas fa-building text-slate-500 text-xs"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-white truncate">
                  {{ form.Empresa_Nombre || 'Inmobiliarte 22' }}
                </p>
                <div class="flex items-center gap-1 mt-0.5">
                  <i v-for="s in 5" :key="s" class="fas fa-star text-[10px] text-amber-400"></i>
                </div>
              </div>
            </div>

            <span
              class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 shrink-0 shadow-sm"
              :style="{ backgroundColor: form.Color_Primario || '#4cc3e9' }"
            >
              Evaluar
            </span>
          </div>

          <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sincronización inmediata de color</span>
            <span class="font-mono uppercase">{{ form.Color_Primario }}</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>