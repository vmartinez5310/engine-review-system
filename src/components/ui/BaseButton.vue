<script setup>
import { computed } from 'vue'

const props = defineProps({
  isLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' }, // Opciones: primary, secondary, danger, outline
  icon: { type: String, default: '' } // Ej: 'fas fa-save'
})

const buttonClasses = computed(() => {
  const base = "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap"
  
  const variants = {
    primary: "bg-brand text-white shadow-md shadow-brand/20 hover:brightness-110",
    secondary: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600",
    danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-transparent dark:border-red-800",
    outline: "border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
  }

  return `${base} ${variants[props.variant] || variants.primary}`
})
</script>

<template>
  <button :type="type" :disabled="disabled || isLoading" :class="buttonClasses">
    <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
    <i v-else-if="icon" :class="icon"></i>
    <span><slot></slot></span>
  </button>
</template>