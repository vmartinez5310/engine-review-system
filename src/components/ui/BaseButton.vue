<script setup>
import { computed } from 'vue'

const props = defineProps({
  isLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  icon: { type: String, default: '' }
})

const buttonClasses = computed(() => {
  const base = "h-10 px-5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none"

  const variants = {
    primary: "bg-brand text-white hover:brightness-105 active:scale-[0.99]",
    secondary: "bg-slate-100 hover:bg-slate-200/80 text-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/50",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 border border-rose-500/20",
    outline: "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
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
