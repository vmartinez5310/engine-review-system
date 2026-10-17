<script setup>
defineProps({
  rows: { type: Number, default: 4 },
  variant: { type: String, default: 'list' } // list | cards | form
})
</script>

<template>
  <div v-if="variant === 'cards'" class="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
    <div v-for="n in rows" :key="n" class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div class="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
      <div class="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
      <div class="h-2.5 w-24 bg-slate-100 dark:bg-slate-700/60 rounded" />
    </div>
  </div>
  <div v-else-if="variant === 'form'" class="space-y-4 animate-pulse max-w-lg">
    <div v-for="n in rows" :key="n" class="space-y-2">
      <div class="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>
  <div v-else class="space-y-3 animate-pulse">
    <div v-for="n in rows" :key="n" class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40">
      <div class="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-3 w-2/5 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-2.5 w-3/5 bg-slate-100 dark:bg-slate-700/60 rounded" />
      </div>
      <div class="h-6 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
    </div>
  </div>
</template>
