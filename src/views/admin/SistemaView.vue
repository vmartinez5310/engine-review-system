<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { hasPermission } from '../../composables/useAuth'
import { cacheStorage } from '../../utils/cache'
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
  const u = form.value.Logo_Horizontal?.trim()
  return u && /^https?:\/\//i.test(u) ? u : null
})

const previewV = computed(() => {
  const u = form.value.Logo_Vertical?.trim()
  return u && /^https?:\/\//i.test(u) ? u : null
})

function applyFormValues(map) {
  form.value = {
    Empresa_Nombre: map.Empresa_Nombre || '',
    Color_Primario: map.Color_Primario || '#4cc3e9',
    Logo_Horizontal: map.Logo_Horizontal || '',
    Logo_Vertical: map.Logo_Vertical || '',
    URL_Frontend_App: map.URL_Frontend_App || ''
  }
}

async function loadConfig() {
  const cached = cacheStorage.get('system_config', 300000)
  if (cached?.data) {
    applyFormValues(cached.data)
    isLoading.value = false
  }

  try {
    const { data, error } = await supabase.from('configuracion').select('*')
    if (error) throw error

    const map = {}
    ;(data || []).forEach(row => { map[row.clave] = row.valor })
    cacheStorage.set('system_config', map)
    applyFormValues(map)
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

async function saveConfig() {
  if (!hasPermission('configurar_sistema')) return
  isSaving.value = true
  try {
    const upserts = Object.entries(form.value).map(([clave, valor]) => ({
      clave,
      valor: String(valor || '').trim(),
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase.from('configuracion').upsert(upserts)
    if (error) throw error

    cacheStorage.remove('system_config')
    document.documentElement.style.setProperty('--brand-color', form.value.Color_Primario)
    window.Swal?.fire({
      icon: 'success',
      title: 'Configuración actualizada',
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

onMounted(loadConfig)
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-y-auto pb-6 select-none">
    <div class="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {{ form.Empresa_Nombre || props.config?.nombre || 'Configuración' }}
        </p>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">Identidad de Marca y Enlaces</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Parámetros visuales y dirección del formulario público
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="isLoading || isSaving"
          class="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          @click="loadConfig"
        >
          Recargar
        </button>

        <BaseButton v-if="hasPermission('configurar_sistema')" :is-loading="isSaving" @click="saveConfig">
          Guardar cambios
        </BaseButton>
      </div>
    </div>

    <SkeletonBlock v-if="isLoading" variant="sistema" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div class="lg:col-span-7 h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-5 sm:p-6 flex flex-col shadow-sm">
        <div class="mb-5 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Identidad Visual</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Nombre institucional, color corporativo y logotipos
          </p>
        </div>

        <div class="space-y-4 flex-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput v-model="form.Empresa_Nombre" label="Nombre comercial" placeholder="Ej. Inmobiliarte 22" />
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Color institucional</label>
              <div class="flex items-center gap-2 h-11 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
                <input
                  v-model="form.Color_Primario"
                  type="color"
                  class="w-7 h-7 cursor-pointer bg-transparent border-0 shrink-0 rounded-full"
                />
                <input
                  v-model="form.Color_Primario"
                  type="text"
                  class="flex-1 px-1 bg-transparent outline-none text-sm font-mono uppercase text-slate-800 dark:text-slate-200"
                  placeholder="#4CC3E9"
                />
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 items-end">
            <div class="flex-1 w-full">
              <BaseInput v-model="form.Logo_Horizontal" label="Logo horizontal (URL)" placeholder="https://..." />
            </div>
            <!-- Contenedor neutro para evitar que el logo se pierda en el color de marca -->
            <div class="w-full sm:w-36 h-11 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
              <img v-if="previewH" :src="previewH" alt="Logo horizontal" class="max-h-full max-w-full object-contain" />
              <span v-else class="text-[11px] text-slate-400">Sin vista previa</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 items-end">
            <div class="flex-1 w-full">
              <BaseInput v-model="form.Logo_Vertical" label="Logo vertical o icono (URL)" placeholder="https://..." />
            </div>
            <!-- Contenedor neutro para evitar que el logo se pierda en el color de marca -->
            <div class="w-14 h-11 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
              <img v-if="previewV" :src="previewV" alt="Logo vertical" class="max-h-full max-w-full object-contain" />
              <i v-else class="fas fa-image text-slate-400 text-sm"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-5 flex flex-col gap-5">
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-5 sm:p-6 shadow-sm">
          <div class="mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Formulario de Clientes</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">URL base donde se emitirán los enlaces de evaluación</p>
          </div>
          <BaseInput v-model="form.URL_Frontend_App" label="Dirección web de la aplicación" placeholder="https://..." />
          <div class="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80">
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estructura del enlace generado</p>
            <p class="text-xs font-mono text-brand mt-1 truncate">
              {{ form.URL_Frontend_App || 'https://tudominio.com' }}/?t=TOKEN
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
