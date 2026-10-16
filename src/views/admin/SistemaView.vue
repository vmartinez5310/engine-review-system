<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '../../services/api'
import { hasPermission } from '../../composables/useAuth'

const isLoading = ref(true)
const isSaving = ref(false)

const form = ref({
  Empresa_Nombre: '',
  Color_Primario: '#334155',
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

onMounted(loadConfig)

async function saveConfig() {
  if (!hasPermission('configurar_sistema')) return
  isSaving.value = true
  try {
    await apiClient.post('update_config', { configuracion: form.value })
    document.documentElement.style.setProperty('--brand-color', form.value.Color_Primario)
    window.Swal?.fire({ icon: 'success', title: 'Configuracion guardada', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
  } catch (e) {
    window.Swal?.fire('Error', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-brand rounded-full animate-spin"></div>
    </div>

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
          <p class="text-[11px] text-slate-400 mt-1">URL publica. Se guarda en la hoja Configuracion.</p>
          <div v-if="previewH" class="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block">
            <img :src="previewH" alt="Logo H" class="h-12 object-contain max-w-[180px]" @error="$event.target.style.display='none'" />
          </div>
        </div>

        <div>
          <BaseInput v-model="form.Logo_Vertical" label="Logo vertical / icono (URL)" placeholder="https://..." icon="fas fa-icons" />
          <p class="text-[11px] text-slate-400 mt-1">Usado en sidebar colapsado e iconos.</p>
          <div v-if="previewV" class="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 inline-block">
            <img :src="previewV" alt="Logo V" class="h-12 w-12 object-contain" @error="$event.target.style.display='none'" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5 shadow-sm">
        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">Aplicacion</h3>
        <BaseInput
          v-model="form.URL_Frontend_App"
          label="URL Frontend App"
          placeholder="https://tudominio.com"
          icon="fas fa-link"
        />
        <p class="text-xs text-slate-400 -mt-3">Base usada para generar los enlaces unicos de resena. Sin barra final.</p>
      </div>

      <div class="flex justify-end">
        <BaseButton
          v-if="hasPermission('configurar_sistema')"
          :is-loading="isSaving"
          icon="fas fa-save"
          @click="saveConfig"
        >
          Guardar configuracion
        </BaseButton>
      </div>
    </div>
  </div>
</template>
