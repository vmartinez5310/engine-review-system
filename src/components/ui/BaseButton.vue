<script setup>
import { computed } from 'vue'

const props = defineProps({
  isLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' }
})

const buttonClasses = computed(() => {
  const base = "h-9 px-4 rounded-full text-xs font-medium tracking-wide transition-all inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none"

  const variants = {
    primary: "bg-brand text-white hover:brightness-105 active:scale-[0.98] shadow-sm",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900",
    outline: "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
  }

  return `${base} ${variants[props.variant] || variants.primary}`
})
</script>

<template>
  <button :type="type" :disabled="disabled || isLoading" :class="buttonClasses">
    <svg v-if="isLoading" class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
    <slot name="icon" />
    <span><slot /></span>
  </button>
</template>
