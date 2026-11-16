<script setup>
defineProps({
  icon: { type: String, default: 'fas fa-folder-open' },
  title: { type: String, default: 'No hay registros' },
  description: { type: String, default: '' }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center fade-in">
    <!-- Círculo de fondo con icono -->
    <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
      <i :class="[icon, 'text-2xl text-slate-300 dark:text-slate-600']"></i>
    </div>
    
    <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ title }}</h4>
    
    <p v-if="description" class="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-xs">
      {{ description }}
    </p>
    
    <!-- Slot opcional por si quieres inyectar un botón debajo del texto -->
    <div v-if="$slots.default" class="mt-5">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }
</style>