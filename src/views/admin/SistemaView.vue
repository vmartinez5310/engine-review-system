<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../services/supabaseClient'
import { hasPermission } from '../../composables/useAuth'
import { cacheStorage } from '../../utils/cache'
import BaseInput from '../../components/ui/BaseInput.vue'
import BaseButton from '../../components/ui/BaseButton.vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) }
})

const isLoading = ref(true)
const isSaving = ref(false)

const form = ref({
  Empresa_Nombre: '',
  Color_Primario: '#4cc3e9',
  Logo_Horizontal: '',
  URL_Frontend_App: '',
  Aviso_Privacidad_URL: ''
})

const previewLogo = computed(() => {
  const u = form.value.Logo_Horizontal?.trim()
  return u && /^https?:\/\//i.test(u) ? u : null
})

function applyFormValues(map) {
  form.value = {
    Empresa_Nombre: map.Empresa_Nombre || '',
    Color_Primario: map.Color_Primario || '#4cc3e9',
    Logo_Horizontal: map.Logo_Horizontal || map.Logo_Vertical || '',
    URL_Frontend_App: map.URL_Frontend_App || '',
    Aviso_Privacidad_URL: map.Aviso_Privacidad_URL || ''
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
    const upserts = [
      { clave: 'Empresa_Nombre', valor: form.value.Empresa_Nombre.trim(), updated_at: new Date().toISOString() },
      { clave: 'Color_Primario', valor: form.value.Color_Primario.trim(), updated_at: new Date().toISOString() },
      { clave: 'Logo_Horizontal', valor: form.value.Logo_Horizontal.trim(), updated_at: new Date().toISOString() },
      { clave: 'Logo_Vertical', valor: form.value.Logo_Horizontal.trim(), updated_at: new Date().toISOString() },
      { clave: 'URL_Frontend_App', valor: form.value.URL_Frontend_App.trim(), updated_at: new Date().toISOString() },
      { clave: 'Aviso_Privacidad_URL', valor: form.value.Aviso_Privacidad_URL.trim(), updated_at: new Date().toISOString() }
    ]

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
  <div class="max-w-4xl mx-auto flex flex-col gap-8 pb-10">
    <div class="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
      <div>
        <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100">Parámetros Institucionales</h3>
        <p class="text-xs text-slate-400 mt-0.5">Identidad corporativa y enlaces de distribución</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          :disabled="isLoading || isSaving"
          class="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          @click="loadConfig"
        >
          Recargar
        </button>
        <BaseButton v-if="hasPermission('configurar_sistema')" :is-loading="isSaving" @click="saveConfig">
          Guardar Cambios
        </BaseButton>
      </div>
    </div>

    <!-- Superficie arquitectónica única sin tarjetas separadas -->
    <div class="border border-slate-200/70 dark:border-slate-800/60 bg-white/40 dark:bg-[#0F172A]/20 backdrop-blur-md rounded-lg divide-y divide-slate-200/60 dark:divide-slate-800/60">
      <!-- Sección Marca -->
      <div class="p-6 sm:p-8 space-y-6">
        <span class="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400 block">Identidad Corporativa</span>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <BaseInput v-model="form.Empresa_Nombre" label="Nombre comercial" placeholder="Ej. Inmobiliarte 22" />

          <div>
            <label class="block text-[10px] font-mono tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1.5">Color institucional</label>
            <div class="flex items-center gap-2 h-10 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0F172A]/40">
              <input
                v-model="form.Color_Primario"
                type="color"
                class="w-6 h-6 cursor-pointer bg-transparent border-0 rounded"
              />
              <input
                v-model="form.Color_Primario"
                type="text"
                class="flex-1 px-1 bg-transparent outline-none text-xs font-mono uppercase text-slate-800 dark:text-slate-200"
                placeholder="#4CC3E9"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 items-end">
          <div class="flex-1 w-full">
            <BaseInput v-model="form.Logo_Horizontal" label="Logotipo institucional (URL)" placeholder="https://..." />
          </div>
          <div class="w-full sm:w-36 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 shrink-0 overflow-hidden">
            <img v-if="previewLogo" :src="previewLogo" alt="Logo" class="max-h-full max-w-full object-contain" />
            <span v-else class="text-[10px] font-mono text-slate-400">Sin vista previa</span>
          </div>
        </div>
      </div>

      <!-- Sección Enlaces -->
      <div class="p-6 sm:p-8 space-y-6">
        <span class="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400 block">Distribución y Legal</span>

        <div class="space-y-4">
          <BaseInput v-model="form.URL_Frontend_App" label="Dirección web de la aplicación" placeholder="https://..." />
          <BaseInput v-model="form.Aviso_Privacidad_URL" label="Enlace al Aviso de Privacidad" placeholder="https://..." />
        </div>

        <div class="p-3 rounded border border-slate-200/60 dark:border-slate-800/60 text-xs">
          <span class="text-[10px] font-mono tracking-widest uppercase text-slate-400 block mb-1">Estructura del enlace de invitación</span>
          <code class="font-mono text-brand text-xs break-all">
            {{ form.URL_Frontend_App || 'https://tudominio.com' }}/?t=TOKEN
          </code>
        </div>
      </div>
    </div>
  </div>
</template>
