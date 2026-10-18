<script setup>
defineProps({
  rows: { type: Number, default: 4 },
  variant: {
    type: String,
    default: 'list'
    // list | cards | form | table | bento | reviews
  }
})
</script>

<template>
  <!-- KPI bento / card grid -->
  <div
    v-if="variant === 'cards' || variant === 'bento'"
    class="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse"
  >
    <div
      v-for="n in rows"
      :key="n"
      class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 min-h-[104px]"
    >
      <div class="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
      <div class="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
      <div class="h-2.5 w-24 bg-slate-100 dark:bg-slate-700/60 rounded" />
    </div>
  </div>

  <!-- Form fields -->
  <div v-else-if="variant === 'form'" class="space-y-4 animate-pulse max-w-lg">
    <div v-for="n in rows" :key="n" class="space-y-2">
      <div class="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>

  <!-- DataTable geometry -->
  <div
    v-else-if="variant === 'table'"
    class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden animate-pulse"
  >
    <div class="h-12 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 flex items-center gap-3 px-4">
      <div class="h-8 flex-1 max-w-xs bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div class="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg ml-auto" />
    </div>
    <div
      v-for="n in rows"
      :key="n"
      class="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
    >
      <div class="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded shrink-0" />
      <div class="h-3 flex-1 max-w-[140px] bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="h-3 flex-1 bg-slate-100 dark:bg-slate-700/60 rounded hidden sm:block" />
      <div class="h-6 w-16 bg-slate-100 dark:bg-slate-700 rounded-full shrink-0" />
    </div>
  </div>

  <!-- Review card list -->
  <div v-else-if="variant === 'reviews'" class="space-y-3 animate-pulse">
    <div
      v-for="n in rows"
      :key="n"
      class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
    >
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
          <div class="h-2.5 w-1/4 bg-slate-100 dark:bg-slate-700/60 rounded" />
        </div>
        <div class="h-5 w-20 bg-slate-100 dark:bg-slate-700 rounded-full" />
      </div>
      <div class="space-y-2">
        <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-700/60 rounded" />
        <div class="h-2.5 w-4/5 bg-slate-100 dark:bg-slate-700/60 rounded" />
      </div>
    </div>
  </div>

  <!-- Default list rows -->
  <div v-else class="space-y-3 animate-pulse">
    <div
      v-for="n in rows"
      :key="n"
      class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40"
    >
      <div class="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-3 w-2/5 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-2.5 w-3/5 bg-slate-100 dark:bg-slate-700/60 rounded" />
      </div>
      <div class="h-6 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
    </div>
  </div>
</template>
