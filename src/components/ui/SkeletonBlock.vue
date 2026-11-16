<script setup>
defineProps({
  rows: { type: Number, default: 6 },
  variant: {
    type: String,
    default: 'list',
    validator: (v) =>
      ['list', 'cards', 'form', 'table', 'bento', 'reviews', 'tokens', 'sistema', 'perfil'].includes(v)
  }
})
</script>

<template>
  <!-- DataTable silhouette -->
  <div
    v-if="variant === 'table' || variant === 'tokens'"
    class="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse select-none"
  >
    <div class="h-14 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-2 shrink-0">
      <div class="h-9 w-full sm:w-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div class="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl ml-auto shrink-0" />
      <div class="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0 hidden sm:block" />
    </div>
    <div class="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-1.5 shrink-0">
      <div v-for="n in 5" :key="'chip' + n" class="h-7 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
    </div>
    <div class="flex-1 min-h-0">
      <div
        v-for="n in rows"
        :key="'row' + n"
        class="h-14 px-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
      >
        <div class="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
        <div class="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
        <div class="h-3.5 flex-1 max-w-[160px] bg-slate-100 dark:bg-slate-800/70 rounded hidden sm:block" />
        <div class="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0 ml-auto" />
      </div>
    </div>
    <div class="h-14 px-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
      <div class="h-3.5 w-24 bg-slate-100 dark:bg-slate-800 rounded hidden sm:block" />
      <div class="h-3.5 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
      <div class="flex gap-2">
        <div class="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div class="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  </div>

  <!-- SistemaView silhouette (7 cols + 5 cols stacked) -->
  <div
    v-else-if="variant === 'sistema'"
    class="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse select-none min-h-0"
  >
    <div class="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div class="space-y-2">
            <div class="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-2.5 w-44 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </div>
        <div class="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div class="sm:col-span-7 space-y-2">
          <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
        <div class="sm:col-span-5 space-y-2">
          <div class="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
      </div>
      <div class="h-20 w-full rounded-xl bg-slate-100/80 dark:bg-slate-800/50" />
      <div class="h-20 w-full rounded-xl bg-slate-100/80 dark:bg-slate-800/50" />
    </div>

    <div class="lg:col-span-5 flex flex-col gap-4 min-h-0">
      <div class="flex-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div class="space-y-2">
            <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-2.5 w-40 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </div>
        <div class="space-y-2">
          <div class="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
        <div class="h-12 w-full bg-slate-100/80 dark:bg-slate-800/50 rounded-xl" />
      </div>

      <div class="flex-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
        <div class="flex justify-between">
          <div class="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-md" />
        </div>
        <div class="h-16 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl my-auto" />
        <div class="h-3 w-full bg-slate-100 dark:bg-slate-800/50 rounded" />
      </div>
    </div>
  </div>

  <!-- PerfilView silhouette (4 cols identity + 8 cols form) -->
  <div
    v-else-if="variant === 'perfil'"
    class="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse select-none min-h-0"
  >
    <div class="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between items-center">
      <div class="w-full flex justify-between">
        <div class="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-md" />
      </div>
      <div class="flex flex-col items-center gap-3 my-auto">
        <div class="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div class="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-3 w-48 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
      <div class="w-full h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
    </div>

    <div class="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-4">
      <div class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div class="space-y-2">
          <div class="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-2.5 w-52 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
      </div>
      <div class="space-y-4 my-auto">
        <div class="space-y-2">
          <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
        <div class="space-y-2">
          <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-11 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        </div>
      </div>
      <div class="h-10 w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
    </div>
  </div>

  <!-- Executive KPI bento -->
  <div
    v-else-if="variant === 'bento'"
    class="h-full w-full flex flex-col gap-4 animate-pulse select-none"
  >
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 shrink-0">
      <div class="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 min-h-[150px] flex flex-col justify-between">
        <div class="flex justify-between gap-4">
          <div class="space-y-3">
            <div class="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-12 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div class="h-9 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full mt-4" />
      </div>
      <div class="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 min-h-[150px] flex flex-col justify-between">
        <div class="flex justify-between gap-4">
          <div class="space-y-3">
            <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-12 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
        <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full mt-4" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 min-h-0">
      <div
        v-for="n in 6"
        :key="'kpi' + n"
        class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 min-h-[100px] flex flex-col justify-between"
      >
        <div class="flex justify-between items-center">
          <div class="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
        <div class="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  </div>

  <!-- Simple card grid -->
  <div
    v-else-if="variant === 'cards'"
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse select-none"
  >
    <div
      v-for="n in rows"
      :key="'card' + n"
      class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 min-h-[104px]"
    >
      <div class="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
      <div class="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div class="h-2.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
    </div>
  </div>

  <!-- Form fields -->
  <div v-else-if="variant === 'form'" class="space-y-4 animate-pulse max-w-lg select-none">
    <div v-for="n in rows" :key="'field' + n" class="space-y-2">
      <div class="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
      <div class="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
    </div>
    <div class="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl ml-auto" />
  </div>

  <!-- Review cards -->
  <div v-else-if="variant === 'reviews'" class="space-y-3 animate-pulse select-none">
    <div
      v-for="n in rows"
      :key="'rev' + n"
      class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 min-h-[112px]"
    >
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="h-2.5 w-1/4 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div class="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
      <div class="space-y-2">
        <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
        <div class="h-2.5 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
    </div>
  </div>

  <!-- Default list -->
  <div v-else class="space-y-3 animate-pulse select-none">
    <div
      v-for="n in rows"
      :key="'list' + n"
      class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 min-h-[56px]"
    >
      <div class="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-3 w-2/5 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-2.5 w-3/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
      <div class="h-5 w-14 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0" />
    </div>
  </div>
</template>