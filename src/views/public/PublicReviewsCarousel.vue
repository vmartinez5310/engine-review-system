<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { supabase } from '../../services/supabaseClient'

const props = defineProps({
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 8000 },
  config: { type: Object, default: () => ({}) }
})

const reviews = ref([])
const localConfig = ref({})
const loading = ref(true)
const index = ref(0)
const isPaused = ref(false)
const slideDirection = ref('next')
let timer = null

const activeConfig = computed(() => ({
  nombre: props.config?.nombre || localConfig.value?.Empresa_Nombre || 'Nuestros Clientes',
  color: props.config?.color || localConfig.value?.Color_Primario || '#334155',
  logoH: props.config?.logoH || localConfig.value?.Logo_Horizontal || null,
  logoV: props.config?.logoV || localConfig.value?.Logo_Vertical || null
}))

const current = computed(() => reviews.value[index.value] || null)
const total = computed(() => reviews.value.length)

const averageRating = computed(() => {
  if (!total.value) return '0.0'
  const sum = reviews.value.reduce((acc, r) => acc + Number(r.calificacion || 0), 0)
  return (sum / total.value).toFixed(1)
})

const clientInitials = computed(() => {
  const nombre = current.value?.cliente || 'Anónimo'
  return nombre.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
})

async function load() {
  loading.value = true
  try {
    const [{ data: resenasData }, { data: cfgData }] = await Promise.all([
      supabase.from('resenas').select('*').eq('estado', 'Aprobado').order('created_at', { ascending: false }),
      supabase.from('configuracion').select('*')
    ])

    reviews.value = resenasData || []

    const map = {}
    ;(cfgData || []).forEach(r => { map[r.clave] = r.valor })
    localConfig.value = map
  } catch (e) {
    console.error('Error cargando reseñas públicas:', e)
    reviews.value = []
  } finally {
    loading.value = false
  }
}

function next() {
  if (total.value < 2) return
  slideDirection.value = 'next'
  index.value = (index.value + 1) % total.value
}

function prev() {
  if (total.value < 2) return
  slideDirection.value = 'prev'
  index.value = (index.value - 1 + total.value) % total.value
}

function start() {
  if (!props.autoplay || total.value < 2) return
  stop()
  isPaused.value = false
  timer = setInterval(next, props.interval)
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
  isPaused.value = true
}

onMounted(async () => {
  await load()
  start()
})

onUnmounted(stop)
</script>

<template>
  <section
    class="relative w-full min-h-[60vh] flex flex-col justify-center bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-500 overflow-hidden outline-none"
    :style="activeConfig.color ? { '--brand-color': activeConfig.color } : {}"
    @mouseenter="stop"
    @mouseleave="start"
  >
    <div class="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-16 relative z-10">
      <div v-if="loading" class="animate-pulse py-12 text-center text-slate-400">
        Cargando testimonios...
      </div>

      <div v-else-if="!total" class="flex flex-col items-center justify-center text-center py-20">
        <i class="fas fa-comment-slash text-5xl mb-6 text-slate-300 dark:text-slate-700" />
        <p class="text-xl md:text-2xl font-light text-slate-500 dark:text-slate-400">
          Las opiniones de nuestros clientes aparecerán aquí pronto.
        </p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div class="lg:col-span-4 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-10 lg:pb-0 lg:pr-12">
          <h2 class="text-sm font-bold tracking-widest uppercase text-brand mb-6">
            {{ activeConfig.nombre }}
          </h2>
          <h3 class="text-3xl font-light text-slate-900 dark:text-white mb-6">
            Lo que dicen <br /><span class="font-bold">nuestros clientes</span>
          </h3>

          <div class="flex items-end gap-4 mb-8">
            <span class="text-6xl font-black text-slate-900 dark:text-white leading-none">
              {{ averageRating }}
            </span>
            <div>
              <div class="flex gap-1 text-amber-500 text-lg mb-1">
                <i v-for="i in 5" :key="i" class="fas fa-star" />
              </div>
              <p class="text-xs text-slate-500">Basado en {{ total }} reseñas</p>
            </div>
          </div>

          <div v-if="total > 1" class="flex items-center gap-4">
            <button
              type="button"
              class="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-brand hover:text-white transition-colors"
              @click="prev"
            >
              <i class="fas fa-arrow-left" />
            </button>
            <button
              type="button"
              class="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-brand hover:text-white transition-colors"
              @click="next"
            >
              <i class="fas fa-arrow-right" />
            </button>
          </div>
        </div>

        <div class="lg:col-span-8 relative min-h-[300px] flex items-center">
          <article class="w-full">
            <i class="fas fa-quote-left text-6xl text-brand opacity-20 mb-6 block" />
            <blockquote class="mb-8">
              <p class="text-2xl md:text-3xl font-light text-slate-800 dark:text-slate-100">
                "{{ current?.comentario }}"
              </p>
            </blockquote>

            <div v-if="current?.respuesta_admin" class="mb-6 border-l-2 border-brand pl-4 py-1">
              <p class="text-xs font-bold uppercase text-brand mb-1">Respuesta</p>
              <p class="text-sm text-slate-600 dark:text-slate-400 italic">"{{ current?.respuesta_admin }}"</p>
            </div>

            <footer class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xl">
                {{ clientInitials }}
              </div>
              <div>
                <p class="text-lg font-bold text-slate-900 dark:text-white">{{ current?.cliente }}</p>
                <p class="text-xs text-slate-500">{{ current?.servicio || 'Cliente Verificado' }} • {{ current?.fecha }}</p>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
