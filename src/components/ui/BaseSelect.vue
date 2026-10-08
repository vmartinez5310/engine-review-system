<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, required: true },
  icon: { type: String, default: '' }, // <- NUEVO PROP PARA EL ÍCONO
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>
    
    <div class="relative">
      <!-- Icono Opcional -->
      <i v-if="icon" :class="[icon, 'absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 z-10']"></i>

      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        :disabled="disabled"
        :class="[
          'w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-900/50 border rounded-xl outline-none transition-colors text-sm text-slate-800 dark:text-white cursor-pointer appearance-none',
          icon ? 'pl-10' : 'pl-3', // <- DEJA ESPACIO SI HAY ÍCONO
          error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand',
          disabled ? 'cursor-not-allowed opacity-70' : ''
        ]"
      >
        <option value="" disabled selected>Selecciona...</option>
        <option v-for="(opt, i) in options" :key="i" :value="opt.value !== undefined ? opt.value : opt">
          {{ opt.label !== undefined ? opt.label : opt }}
        </option>
      </select>
      
      <i class="fas fa-chevron-down absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
    </div>

    <Transition name="fade">
      <p v-if="error" class="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
        <i class="fas fa-exclamation-circle"></i> {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>