<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { apiClient } from '../../services/api'

const props = defineProps({
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 5000 }
})

const reviews = ref([])
const loading = ref(true)
const index = ref(0)
let timer = null

const current = computed(() => reviews.value[index.value] || null)
const total = computed(() => reviews.value.length)

async function load() {
  loading.value = true
  try {
    reviews.value = await apiClient.post('get_public_reviews') || []
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

function next() {
  if (!total.value) return
  index.value = (index.value + 1) % total.value
}

function prev() {
  if (!total.value) return
  index.value = (index.value - 1 + total.value) % total.value
}

function go(i) {
  index.value = i
}

function start() {
  if (!props.autoplay || total.value < 2) return
  stop()
  timer = setInterval(next, props.interval)
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

onMounted(async () => {
  await load()
  start()
})

onUnmounted(stop)
</script>

<template>
  <div
    class="relative w-full max-w-xl mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-lg"
    @mouseenter="stop"
    @mouseleave="start"
  >
    <div v-if="loading" class="h-40 flex items-center justify-center">
      <div class="w-8 h-8 border-2 border-white/20 border-t-sky-400 rounded-full animate-spin" />
    </div>

    <div v-else-if="!total" class="h-40 flex items-center justify-center text-slate-400 text-sm">
      Sin reseñas públicas aún.
    </div>

    <div v-else class="min-h-[160px]">
      <div class="flex items-center gap-1 mb-3">
        <i
          v-for="s in 5"
          :key="s"
          class="fas fa-star text-sm"
          :class="s <= Math.round(current.calificacion || 0) ? 'text-amber-400' : 'text-slate-600'"
        />
        <span class="ml-2 text-xs text-slate-400 tabular-nums">{{ (current.calificacion || 0).toFixed(1) }}</span>
      </div>

      <p class="text-slate-100 text-sm leading-relaxed mb-4 line-clamp-4">
        “{{ current.comentario }}”
      </p>

      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-white truncate">{{ current.cliente }}</p>
          <p class="text-xs text-slate-400 truncate">{{ current.zona }} · {{ current.fecha }}</p>
        </div>
        <div class="flex gap-1 shrink-0">
          <button type="button" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200" @click="prev">
            <i class="fas fa-chevron-left text-xs" />
          </button>
          <button type="button" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200" @click="next">
            <i class="fas fa-chevron-right text-xs" />
          </button>
        </div>
      </div>

      <div class="flex justify-center gap-1.5 mt-4">
        <button
          v-for="(_, i) in reviews"
          :key="i"
          type="button"
          class="w-1.5 h-1.5 rounded-full transition-all"
          :class="i === index ? 'bg-sky-400 w-4' : 'bg-slate-600'"
          @click="go(i)"
        />
      </div>
    </div>
  </div>
</template>
