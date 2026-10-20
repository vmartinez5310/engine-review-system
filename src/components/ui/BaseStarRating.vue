<script setup>
defineProps({
  score: { type: Number, required: true },
  max: { type: Number, default: 5 },
  size: { type: String, default: 'text-sm' } // Opciones: text-xs, text-sm, text-base, text-lg
})
</script>

<template>
  <div class="flex items-center gap-1">
    <i 
      v-for="n in max" 
      :key="n"
      :class="[
        'fas fa-star transition-colors',
        size,
        n <= score ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200 dark:text-slate-700'
      ]"
    ></i>
  </div>
</template>