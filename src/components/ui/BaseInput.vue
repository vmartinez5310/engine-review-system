<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  icon: { type: String, default: '' }, // Ej: 'fas fa-envelope'
  error: { type: String, default: '' },
  readonly: { type: Boolean, default: false }
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
      <i v-if="icon" :class="[icon, 'absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400']"></i>
      
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :type="type"
        :placeholder="placeholder"
        :readonly="readonly"
        :class="[
          'w-full p-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl outline-none transition-colors text-sm text-slate-800 dark:text-white',
          icon ? 'pl-10' : 'pl-3',
          error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand',
          readonly ? 'cursor-not-allowed opacity-70' : ''
        ]"
      />
    </div>
    
    <!-- Mensaje de Error -->
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