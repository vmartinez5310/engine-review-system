<script setup>
import { ref, computed, onMounted } from 'vue'
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
  const u = form.value.Logo_Horizontal?.trim()
  return u && /^https?:\/\//i.test(u) ? u : null
})

const previewV = computed(() => {
  const u = form.value.Logo_Vertical?.trim()
  return u && /^https?:\/\//i.test(u) ? u : null
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

onMounted(loadConfig)
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-y-auto pb-6 select-none">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-slate-400">
          {{ form.Empresa_Nombre || props.config?.nombre || 'Configuración' }}
        </p>
        <h2 class="text-2xl font-semibold text-white mt-1">Identidad y enlaces</h2>
        <p class="text-sm text-slate-400 mt-1">
          Cómo se ve tu marca y dónde reciben los clientes las reseñas
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button type="button" :disabled="isLoading || isSaving"
          class="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          @click="loadConfig">
          Recargar
        </button>

        <BaseButton v-if="hasPermission('configurar_sistema')" :is-loading="isSaving" @click="saveConfig">
          Guardar cambios
        </BaseButton>
      </div>
    </div>

    <SkeletonBlock v-if="isLoading" variant="sistema" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Identidad -->
      <div class="lg:col-span-7 h-full rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col">
        <div class="mb-5">
          <h3 class="text-sm font-medium text-white">Tu marca</h3>
          <p class="text-xs text-slate-400 mt-1">
            Nombre, color y logos que aparecen en invitaciones y reseñas
          </p>
        </div>

        <div class="space-y-5 flex-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput v-model="form.Empresa_Nombre" label="Nombre de la empresa" placeholder="Inmobiliarte 22" />

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">
                Color de marca
              </label>
              <!-- Añadimos px-2 para dar espacio interno -->
              <div
                class="flex items-center gap-2 h-11 px-2 rounded-xl border border-white/15 bg-white/5 overflow-hidden">
                <!-- Modificado para ser totalmente circular -->
                <input v-model="form.Color_Primario" type="color"
                  class="w-7 h-7 cursor-pointer bg-transparent border-0 shrink-0 rounded-full overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full" />
                <input v-model="form.Color_Primario" type="text"
                  class="flex-1 px-1 bg-transparent outline-none text-sm font-mono uppercase text-slate-100"
                  placeholder="#4CC3E9" />
              </div>
            </div>
          </div>

          <!-- Logo horizontal (Alineado con items-end) -->
          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="flex-1 w-full">
              <BaseInput v-model="form.Logo_Horizontal" label="Logo horizontal" placeholder="https://..." />
            </div>
            <!-- Cambiado h-14 por h-11 para hacer match exacto con la altura del input -->
            <div
              class="w-full sm:w-36 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0 overflow-hidden">
              <img v-if="previewH" :src="previewH" alt="Logo horizontal" class="max-h-full max-w-full object-contain" />
              <span v-else class="text-xs text-slate-500">Vista previa</span>
            </div>
          </div>

          <!-- Logo vertical (Alineado con items-end) -->
          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="flex-1 w-full">
              <BaseInput v-model="form.Logo_Vertical" label="Logo vertical / icono" placeholder="https://..." />
            </div>
            <!-- Cambiado h-14 por h-11 para hacer match exacto con la altura del input -->
            <div
              class="w-14 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0 overflow-hidden">
              <img v-if="previewV" :src="previewV" alt="Logo vertical" class="max-h-full max-w-full object-contain" />
              <i v-else class="fas fa-cube text-slate-500 text-sm"></i>
            </div>
          </div>
        </div>
      </div>


      <!-- Dominio + Preview -->
      <div class="lg:col-span-5 flex flex-col gap-6">

        <!-- Enlaces -->
        <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div class="mb-5">
            <h3 class="text-sm font-medium text-white">Enlace de reseñas</h3>
            <p class="text-xs text-slate-400 mt-1">
              URL base donde los clientes abren el formulario de evaluación
            </p>
          </div>

          <BaseInput v-model="form.URL_Frontend_App" label="URL de la aplicación"
            placeholder="https://inmobiliarte22.com.mx/resenas" />

          <div class="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <p class="text-xs text-slate-400">Estructura de invitación</p>
            <p class="text-xs font-mono text-sky-400 mt-1 truncate">
              {{ form.URL_Frontend_App || 'https://tudominio.com' }}/?t=TOKEN
            </p>
          </div>
        </div>

        <!-- Live preview -->
        <div class="flex-1 rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col">
          <div class="mb-5">
            <h3 class="text-sm font-medium text-white">Así se ve tu marca</h3>
            <p class="text-xs text-slate-400 mt-1">
              Vista previa de cómo aparece en las invitaciones
            </p>
          </div>

          <div class="flex-1 flex items-center">
            <div
              class="w-full p-4 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="previewV || previewH" :src="previewV || previewH" alt="Logo"
                    class="max-h-full max-w-full object-contain" />
                  <i v-else class="fas fa-building text-slate-500 text-xs"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-white truncate">
                    {{ form.Empresa_Nombre || 'Tu empresa' }}
                  </p>
                  <div class="flex gap-0.5 mt-0.5">
                    <i v-for="n in 5" :key="n" class="fas fa-star text-[10px] text-amber-400"></i>
                  </div>
                </div>
              </div>

              <span class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-950 shrink-0"
                :style="{ backgroundColor: form.Color_Primario || '#4cc3e9' }">
                Evaluar
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>