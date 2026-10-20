<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { apiClient } from '../../services/api'

const props = defineProps({
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 8000 },
  config: {
    type: Object,
    default: () => ({})
  }
})

const reviews = ref([])
const localConfig = ref({})
const loading = ref(true)
const index = ref(0)
const isPaused = ref(false)
const slideDirection = ref('next')
const touchStartX = ref(0)
const touchEndX = ref(0)
let timer = null

// Fusión reactiva de configuración sin hardcode
const activeConfig = computed(() => ({
  nombre: props.config?.nombre || localConfig.value?.nombre || 'Nuestros Clientes',
  color: props.config?.color || localConfig.value?.color || '#334155',
  logoH: props.config?.logoH || localConfig.value?.logoH || null,
  logoV: props.config?.logoV || localConfig.value?.logoV || null,
  urlFrontend: props.config?.urlFrontend || localConfig.value?.urlFrontend || ''
}))

const current = computed(() => reviews.value[index.value] || null)
const total = computed(() => reviews.value.length)

// Cálculo dinámico de calificación promedio
const averageRating = computed(() => {
  if (!total.value) return '0.0'
  const sum = reviews.value.reduce((acc, r) => acc + Number(r.calificacion ?? r.Calificacion ?? 0), 0)
  return (sum / total.value).toFixed(1)
})

// Normalizadores de campos
const currentRating = computed(() => Number(current.value?.calificacion ?? current.value?.Calificacion ?? 0))
const currentComment = computed(() => current.value?.comentario ?? current.value?.Comentario ?? '')
const currentClient = computed(() => current.value?.cliente ?? current.value?.Cliente ?? 'Cliente Anónimo')
const currentService = computed(() => current.value?.zona ?? current.value?.Servicio ?? current.value?.servicio ?? '')
const currentDate = computed(() => current.value?.fecha ?? current.value?.Fecha ?? '')
const currentAdminReply = computed(() => current.value?.respuesta ?? current.value?.respuesta_admin ?? current.value?.Respuesta_Admin ?? '')
const currentId = computed(() => current.value?.id ?? current.value?.ID_Resena ?? index.value)

// Iniciales dinámicas para el monograma gigante
const clientInitials = computed(() => {
  return currentClient.value.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
})

// Formateo de fecha estandarizado
const formattedDate = computed(() => {
  const raw = currentDate.value
  if (!raw) return ''
  const match = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(d)
    }
  }
  return raw
})

// SCHEMA.ORG JSON-LD PARA AEO/SEO/GEO/AIO
const jsonLdSchema = computed(() => {
  if (!total.value) return null
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": activeConfig.value.nombre,
    "image": activeConfig.value.logoH || activeConfig.value.logoV || "",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating.value,
      "reviewCount": total.value
    },
    "review": reviews.value.filter(r => r.Legal_OK !== false).map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.cliente || r.Cliente || "Anónimo" },
      "datePublished": r.fecha || r.Fecha,
      "reviewBody": r.comentario || r.Comentario,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": Number(r.calificacion || r.Calificacion || 0),
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  })
})

async function load() {
  loading.value = true
  try {
    const requests = [apiClient.post('get_public_reviews')]
    if (!props.config?.nombre && !props.config?.logoH && !props.config?.logoV) {
      requests.push(apiClient.post('get_public_config').catch(() => null))
    }
    const [reviewsRes, configRes] = await Promise.all(requests)
    reviews.value = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.data || [])
    if (configRes) localConfig.value = configRes?.data || configRes
  } catch {
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

function restartTimer() {
  if (props.autoplay && total.value > 1) {
    stop()
    start()
  }
}

function handleTouchStart(e) {
  touchStartX.value = e.changedTouches[0].screenX
  stop()
}

function handleTouchEnd(e) {
  touchEndX.value = e.changedTouches[0].screenX
  const delta = touchStartX.value - touchEndX.value
  if (Math.abs(delta) > 50) delta > 0 ? next() : prev()
  start()
}

function handleKeydown(e) {
  if (e.key === 'ArrowLeft') { prev(); restartTimer() }
  else if (e.key === 'ArrowRight') { next(); restartTimer() }
}

watch(() => props.interval, restartTimer)
watch(() => props.autoplay, (val) => (val ? start() : stop()))

onMounted(async () => {
  await load()
  start()
})

onUnmounted(stop)
</script>

<template>
  <section
    class="relative w-full min-h-[60vh] xl:min-h-[75vh] flex flex-col justify-center bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-500 overflow-hidden outline-none"
    :style="activeConfig.color ? { '--brand-color': activeConfig.color } : {}"
    tabindex="0"
    aria-label="Testimonios de clientes"
    @mouseenter="stop"
    @mouseleave="start"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
    @keydown="handleKeydown"
  >
    <!-- Schema.org Inject -->
    <component v-if="jsonLdSchema" :is="'script'" type="application/ld+json" v-html="jsonLdSchema" />

    <!-- Acento decorativo de fondo abstracto -->
    <div class="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[var(--brand-color)] opacity-[0.03] dark:opacity-[0.05] blur-3xl pointer-events-none" />
    <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[var(--brand-color)] opacity-[0.03] dark:opacity-[0.05] blur-3xl pointer-events-none" />

    <div class="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-16 relative z-10">
      
      <!-- Skeleton Loading State -->
      <div v-if="loading" class="grid lg:grid-cols-12 gap-12 lg:gap-24 animate-pulse items-center">
        <div class="lg:col-span-4 space-y-6">
          <div class="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-20 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div class="lg:col-span-8 space-y-8">
          <div class="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-12 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="flex items-center gap-6 mt-12">
            <div class="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div class="space-y-3">
              <div class="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div class="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!total" class="flex flex-col items-center justify-center text-center py-20">
        <i class="fas fa-comment-slash text-5xl mb-6 text-slate-300 dark:text-slate-700 font-black" />
        <p class="text-xl md:text-2xl font-light text-slate-500 dark:text-slate-400">Las historias de nuestros clientes aparecerán aquí pronto.</p>
      </div>

      <!-- Layout Principal Asimétrico -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
        
        <!-- Columna Izquierda: Contexto de Marca y Métricas -->
        <div class="lg:col-span-4 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-10 lg:pb-0 lg:pr-12">
          
          <img
            v-if="activeConfig.logoH || activeConfig.logoV"
            :src="activeConfig.logoH || activeConfig.logoV"
            :alt="activeConfig.nombre"
            class="h-10 object-contain mb-10 max-w-[200px]"
          />
          <h2 v-else class="text-sm font-bold tracking-widest uppercase text-[var(--brand-color)] mb-10">
            {{ activeConfig.nombre }}
          </h2>

          <h3 class="text-3xl md:text-4xl font-light text-slate-900 dark:text-white leading-tight mb-8">
            Lo que dicen <br/>
            <span class="font-bold">nuestros clientes</span>
          </h3>

          <!-- Calificación Global -->
          <div class="flex items-end gap-4 mb-10">
            <span class="text-7xl font-black text-slate-900 dark:text-white tabular-nums leading-none tracking-tighter">{{ averageRating }}</span>
            <div class="pb-2">
              <div class="flex gap-1 text-amber-500 text-lg mb-1">
                <!-- Se fuerza el font-weight de FA internamente -->
                <i v-for="i in 5" :key="i" class="fas fa-star font-black" />
              </div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Basado en {{ total }} reseñas
              </p>
            </div>
          </div>

          <!-- Controles de Navegación Estilo Editorial -->
          <div v-if="total > 1" class="flex items-center gap-6 mt-auto">
            <div class="flex gap-3">
              <!-- Se eliminó 'font-light' para que FontAwesome renderice correctamente -->
              <button type="button" aria-label="Anterior" @click="prev(); restartTimer()"
                class="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-[var(--brand-color)] hover:border-[var(--brand-color)] hover:text-white transition-all duration-300 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                :style="{ '--tw-ring-color': 'var(--brand-color)' }">
                <i class="fas fa-arrow-left text-lg font-black" />
              </button>
              <button type="button" aria-label="Siguiente" @click="next(); restartTimer()"
                class="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-[var(--brand-color)] hover:border-[var(--brand-color)] hover:text-white transition-all duration-300 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                :style="{ '--tw-ring-color': 'var(--brand-color)' }">
                <i class="fas fa-arrow-right text-lg font-black" />
              </button>
            </div>
            
            <div class="text-lg font-medium text-slate-400 tabular-nums tracking-widest">
              <span class="text-slate-900 dark:text-white">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="opacity-50 mx-1">/</span>
              <span>{{ String(total).padStart(2, '0') }}</span>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: El Testimonio Activo -->
        <div class="lg:col-span-8 relative min-h-[400px] flex items-center">
          
          <Transition :name="slideDirection === 'next' ? 'slide-next' : 'slide-prev'" mode="out-in">
            <article :key="currentId" class="w-full relative z-10" itemscope itemtype="https://schema.org/Review">
              
              <i class="fas fa-quote-left text-7xl md:text-8xl text-[var(--brand-color)] opacity-20 mb-6 block font-black" />

              <blockquote class="mb-12" itemprop="reviewBody">
                <p class="text-2xl md:text-4xl lg:text-5xl leading-snug md:leading-tight font-light text-slate-800 dark:text-slate-100 tracking-tight">
                  "{{ currentComment }}"
                </p>
              </blockquote>

              <div v-if="currentAdminReply" class="mb-12 border-l-2 border-[var(--brand-color)] pl-6 py-2">
                <p class="text-xs font-bold uppercase tracking-widest text-[var(--brand-color)] mb-2">Respuesta de {{ activeConfig.nombre }}</p>
                <p class="text-base text-slate-600 dark:text-slate-400 italic">"{{ currentAdminReply }}"</p>
              </div>

              <footer class="flex items-center gap-6" itemprop="author" itemscope itemtype="https://schema.org/Person">
                
                <!-- MONOGRAMA CORREGIDO: Uso de pure background-color + superposición translúcida -->
                <div class="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full flex items-center justify-center text-2xl md:text-3xl font-light text-white shadow-xl shadow-[var(--brand-color)]/20"
                  :style="{ 
                    backgroundColor: 'var(--brand-color)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.25) 100%)' 
                  }">
                  {{ clientInitials }}
                </div>
                
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <p class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white" itemprop="name">
                      {{ currentClient }}
                    </p>
                    <!-- SEPARACIÓN DE CLASES EN EL BADGE PARA PROTEGER EL ÍCONO -->
                    <span v-if="current.Legal_OK !== false" class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest flex items-center gap-1">
                      <i class="fas fa-check font-black" />
                      <span class="font-bold">VERIFICADA</span>
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-2 text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                    <span v-if="currentService" class="font-medium">{{ currentService }}</span>
                    <span v-if="currentService && formattedDate" class="opacity-50">&bull;</span>
                    <span v-if="formattedDate" class="capitalize" itemprop="datePublished" :content="currentDate">{{ formattedDate }}</span>
                  </div>

                  <div class="flex items-center gap-1 text-amber-500 text-xs mt-3" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
                    <meta itemprop="ratingValue" :content="currentRating.toString()" />
                    <i v-for="s in 5" :key="s" class="fas fa-star font-black" :class="s <= Math.round(currentRating) ? 'text-amber-500' : 'text-slate-200 dark:text-slate-800'" />
                  </div>
                </div>
              </footer>
            </article>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-next-enter-from { opacity: 0; transform: translateY(20px); }
.slide-next-leave-to { opacity: 0; transform: translateY(-20px); }
.slide-prev-enter-from { opacity: 0; transform: translateY(-20px); }
.slide-prev-leave-to { opacity: 0; transform: translateY(20px); }

@media (min-width: 1024px) {
  .slide-next-enter-from { opacity: 0; transform: translateX(40px); }
  .slide-next-leave-to { opacity: 0; transform: translateX(-40px); }
  .slide-prev-enter-from { opacity: 0; transform: translateX(-40px); }
  .slide-prev-leave-to { opacity: 0; transform: translateX(40px); }
}
</style>