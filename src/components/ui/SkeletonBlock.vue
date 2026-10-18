<script setup>
defineProps({
  rows: { type: Number, default: 4 },
  variant: {
    type: String,
    default: 'list'
    // list | cards | form | table | bento | reviews
  }
  /**
   * Variantes soportadas:
   * - 'bento' (o 'cards' con rows=8): Bento Grid ejecutivo sin scroll (2 Hero + 6 operativas)
   * - 'cards': Cuadrícula de tarjetas estándar adaptable
   * - 'tokens' | 'table': Vista con filtros de estado superiores + filas de tabla/enlaces
   * - 'list': Lista de reseñas o elementos con avatar, detalles y badge
   * - 'form': Formulario de configuración o perfil con campos y botón de acción
   */
  variant: { type: String, default: 'list' }
})
</script>

<template>
  <!-- KPI bento / card grid -->
  <div
    v-if="variant === 'cards' || variant === 'bento'"
    class="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse"
  <!-- 1. VARIANTE BENTO EJECUTIVO (Se activa con variant="bento" o variant="cards" :rows="8") -->
  <div
    v-if="variant === 'bento' || (variant === 'cards' && rows === 8)"
    class="h-full w-full flex flex-col lg:grid lg:grid-rows-12 gap-4 animate-pulse select-none"
  >
    <!-- Nivel 1: 2 Hero Cards (5 de 12 filas en Desktop) -->
    <div class="lg:row-span-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:min-h-0">
      <!-- Hero Izquierdo (Calificación Media) -->
      <div class="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 xl:p-6 flex flex-col justify-between gap-5">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20" />
              <div class="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
            <div class="flex items-baseline gap-3 pt-1">
              <div class="h-14 xl:h-16 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div class="h-4 w-14 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <div class="h-9 w-32 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50" />
            <div class="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </div>

        <div class="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div class="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div class="h-6 w-28 bg-emerald-500/10 border border-emerald-500/20 rounded-lg" />
          </div>
          <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
      </div>

      <!-- Hero Derecho (Conversión de Enlaces) -->
      <div class="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 xl:p-6 flex flex-col justify-between gap-5">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-3">
            <div class="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div class="flex items-baseline gap-2.5 pt-1">
              <div class="h-14 xl:h-16 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div class="h-4 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
          </div>
          <div class="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 shrink-0" />
        </div>

        <div class="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div class="flex justify-between">
            <div class="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            <div class="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>

    <!-- Nivel 2: Matriz Operativa 3x2 (7 de 12 filas en Desktop) -->
    <div class="lg:row-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:min-h-0">
      <div
        v-for="n in 6"
        :key="n"
        class="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/95 p-5 xl:p-6 flex flex-col justify-between gap-4"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div class="w-11 h-11 xl:w-12 xl:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 shrink-0" />
        </div>

        <div class="flex items-baseline justify-between gap-3 my-auto">
          <div class="h-10 xl:h-12 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div class="h-6 w-16 bg-slate-100 dark:bg-slate-800/70 rounded-lg" />
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
          <div class="h-3 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
          <div class="h-3 w-3 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </div>
    </div>
  </div>

  <!-- 2. VARIANTE CARDS ESTÁNDAR (Para grillas de tarjetas cuando rows !== 8) -->
  <div
    v-else-if="variant === 'cards'"
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse select-none"
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
      class="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/95 p-5 flex flex-col justify-between gap-4"
    >
      <div class="flex items-center justify-between">
        <div class="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0" />
      </div>
      <div class="h-9 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div class="pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
        <div class="h-2.5 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
    </div>
  </div>

  <!-- 3. VARIANTE TOKENS / TABLE (Ideal para "Reseñas / Por evaluar" y Usuarios) -->
  <div
    v-else-if="variant === 'tokens' || variant === 'table'"
    class="space-y-4 animate-pulse select-none"
  >
    <!-- Barra superior de filtros de estado (Activos, Usados, Expirados, Revocados) -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-1">
      <div class="flex items-center gap-2">
        <div v-for="t in 4" :key="t" class="h-9 w-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800" />
      </div>
      <div class="h-9 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800" />
    </div>

    <!-- Contenedor de filas tipo tabla ejecutiva -->
    <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/95 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/70">
      <div
        v-for="n in rows"
        :key="n"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 xl:px-6"
      >
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0" />
          <div class="space-y-2">
            <div class="h-3.5 w-40 sm:w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div class="h-2.5 w-28 sm:w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-3">
          <div class="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/50" />
          <div class="h-8 w-8 bg-slate-100 dark:bg-slate-800/80 rounded-lg" />
        </div>
      </div>
    </div>
  </div>

  <!-- 4. VARIANTE FORM (Formularios de configuración y perfil) -->
  <div
    v-else-if="variant === 'form'"
    class="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/95 p-6 max-w-2xl space-y-5 animate-pulse select-none"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div v-for="n in rows" :key="n" class="space-y-2" :class="{ 'sm:col-span-2': n === rows && rows % 2 !== 0 }">
        <div class="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
        <div class="h-11 w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-800 rounded-xl" />
      </div>
    </div>
    <div class="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
      <div class="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>

  <!-- 5. VARIANTE LIST (Por defecto: Lista de reseñas y auditoría) -->
  <div v-else class="space-y-3.5 animate-pulse select-none">
    <div
      v-for="n in rows"
      :key="n"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/95"
    >
      <div class="flex items-start sm:items-center gap-4 flex-1">
        <div class="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0" />
        <div class="flex-1 space-y-2.5 w-full">
          <div class="flex items-center gap-2.5">
            <div class="h-3.5 w-1/3 max-w-[180px] bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div class="h-4 w-20 bg-amber-500/10 rounded-md" />
          </div>
          <div class="h-2.5 w-4/5 max-w-[420px] bg-slate-100 dark:bg-slate-800/70 rounded" />
        </div>
      </div>
      <div class="flex items-center justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
        <div class="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div class="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  </div>
</template>