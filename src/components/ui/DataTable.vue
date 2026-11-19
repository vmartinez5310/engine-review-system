<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  filterOptions: { type: Array, default: () => [] },
  filterColumnKey: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Buscar...' },
  mobilePreviewCount: { type: Number, default: 2 }
})

defineEmits(['row-action', 'row-click'])

const isColumnPickerOpen = ref(false)
const selectedColumns = ref([])

onMounted(() => {
  selectedColumns.value = props.columns.filter((c) => !c.hidden).map((c) => c.key)
})

const activeColumns = computed(() =>
  props.columns.filter((col) => col.required || selectedColumns.value.includes(col.key))
)

const searchQuery = ref('')
const selectedFilter = ref('all')
const itemsPerPage = ref(10)
const currentPage = ref(1)
const sortColumn = ref('')
const sortAsc = ref(true)
const expandedRows = ref([])

watch([searchQuery, selectedFilter, itemsPerPage], () => {
  currentPage.value = 1
  expandedRows.value = []
})

const filteredAndSortedData = computed(() => {
  let result = [...props.data]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((row) =>
      props.columns.some((col) => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }

  if (selectedFilter.value !== 'all' && props.filterColumnKey) {
    result = result.filter((row) => String(row[props.filterColumnKey]).toLowerCase() === String(selectedFilter.value).toLowerCase())
  }

  if (sortColumn.value) {
    result.sort((a, b) => {
      const valA = a[sortColumn.value]
      const valB = b[sortColumn.value]
      if (valA === valB) return 0
      const comparison = valA > valB ? 1 : -1
      return sortAsc.value ? comparison : -comparison
    })
  }
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredAndSortedData.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() =>
  Math.ceil(filteredAndSortedData.value.length / itemsPerPage.value) || 0
)
const totalItems = computed(() => filteredAndSortedData.value.length)
const currentRangeStart = computed(() =>
  totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
)
const currentRangeEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
)

function handleSort(colKey) {
  if (sortColumn.value === colKey) {
    sortAsc.value = !sortAsc.value
  } else {
    sortColumn.value = colKey
    sortAsc.value = true
  }
}

function toggleRow(id) {
  const index = expandedRows.value.indexOf(id)
  if (index > -1) expandedRows.value.splice(index, 1)
  else expandedRows.value.push(id)
}

function rowKey(row, index) {
  return row.id ?? row.fila ?? index
}
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden">
    <!-- Barra superior compacta -->
    <div class="h-12 px-3 sm:px-4 border-b border-slate-200/80 dark:border-slate-800 flex gap-2 items-center shrink-0">
      <div class="flex-1 relative">
        <svg class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full h-8 pl-8 pr-3 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-brand"
        />
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Selector de Columnas con icono -->
        <div class="relative">
          <button
            type="button"
            class="h-8 px-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
            @click="isColumnPickerOpen = !isColumnPickerOpen"
            title="Seleccionar columnas"
          >
            <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path>
            </svg>
            <span class="hidden sm:inline">Columnas</span>
          </button>

          <div v-if="isColumnPickerOpen" class="fixed inset-0 z-40" @click="isColumnPickerOpen = false"></div>

          <div
            v-if="isColumnPickerOpen"
            class="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 p-2"
          >
            <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1">Columnas visibles</div>
            <div class="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
              <label
                v-for="col in columns"
                :key="col.key"
                class="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-300"
                :class="{ 'opacity-50 cursor-not-allowed': col.required }"
              >
                <input
                  v-model="selectedColumns"
                  type="checkbox"
                  :value="col.key"
                  :disabled="col.required"
                  class="rounded text-brand border-slate-300 focus:ring-brand"
                />
                <span class="truncate">{{ col.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- En móvil los botones secundarios de header se ocultan para evitar duplicación con el FAB -->
        <div class="hidden md:inline-flex items-center">
          <slot name="header-actions" />
        </div>
      </div>
    </div>

    <!-- Pestañas de Filtro -->
    <div
      v-if="filterOptions.length > 0"
      class="px-3 py-1.5 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 shrink-0 overflow-x-auto"
    >
      <button
        type="button"
        class="h-6 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer"
        :class="selectedFilter === 'all' ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
        @click="selectedFilter = 'all'"
      >
        Todos
      </button>
      <button
        v-for="opt in filterOptions"
        :key="opt"
        type="button"
        class="h-6 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer"
        :class="selectedFilter === opt ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
        @click="selectedFilter = opt"
      >
        {{ opt }}
      </button>
    </div>

    <!-- Tabla Desktop -->
    <div class="flex-1 overflow-auto">
      <table class="min-w-full text-left text-xs whitespace-nowrap hidden md:table">
        <thead class="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr class="h-10">
            <th
              v-for="col in activeColumns"
              :key="col.key"
              class="px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none transition-colors"
              @click="handleSort(col.key)"
            >
              <div class="flex items-center gap-1.5">
                <span>{{ col.label }}</span>
                <svg v-if="sortColumn === col.key" class="w-3 h-3 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path :d="sortAsc ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'" />
                </svg>
              </div>
            </th>
            <th v-if="$slots.actions" class="px-4 text-right">Acción</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
          <tr v-if="paginatedData.length === 0">
            <td :colspan="activeColumns.length + ($slots.actions ? 1 : 0)" class="py-12 text-center text-slate-400">
              Sin registros para mostrar.
            </td>
          </tr>

          <tr
            v-for="(row, index) in paginatedData"
            :key="rowKey(row, index)"
            class="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            @click="$emit('row-click', row)"
          >
            <td
              v-for="col in activeColumns"
              :key="col.key"
              class="px-4 text-slate-700 dark:text-slate-300"
            >
              <slot :name="'cell-' + col.key" :item="row">{{ row[col.key] }}</slot>
            </td>
            <td
              v-if="$slots.actions"
              class="px-4 text-right"
              @click.stop
            >
              <slot name="actions" :item="row" />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Versión Móvil -->
      <div class="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div
          v-for="(row, index) in paginatedData"
          :key="rowKey(row, index)"
          class="p-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer"
          @click="$emit('row-click', row)"
        >
          <div v-for="col in activeColumns.slice(0, mobilePreviewCount)" :key="col.key" class="flex justify-between items-baseline gap-2">
            <span class="text-xs text-slate-400 font-medium">{{ col.label }}</span>
            <div class="text-xs text-slate-800 dark:text-slate-200 text-right">
              <slot :name="'cell-' + col.key" :item="row">{{ row[col.key] }}</slot>
            </div>
          </div>

          <div v-show="expandedRows.includes(rowKey(row, index))" class="pt-2 flex flex-col gap-2">
            <div v-for="col in activeColumns.slice(mobilePreviewCount)" :key="col.key" class="flex justify-between items-baseline gap-2">
              <span class="text-xs text-slate-400 font-medium">{{ col.label }}</span>
              <div class="text-xs text-slate-800 dark:text-slate-200 text-right">
                <slot :name="'cell-' + col.key" :item="row">{{ row[col.key] }}</slot>
              </div>
            </div>
            <div v-if="$slots.actions" class="pt-2 flex justify-end" @click.stop>
              <slot name="actions" :item="row" />
            </div>
          </div>

          <button
            v-if="activeColumns.length > mobilePreviewCount"
            type="button"
            class="text-xs text-brand font-medium text-left mt-1"
            @click.stop="toggleRow(rowKey(row, index))"
          >
            {{ expandedRows.includes(rowKey(row, index)) ? 'Menos detalles' : 'Más detalles' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Paginación Footer -->
    <div class="h-10 px-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
      <div class="flex items-center gap-1.5">
        <span>Filas</span>
        <select
          v-model="itemsPerPage"
          class="bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
        </select>
      </div>

      <div class="tabular-nums">
        {{ currentRangeStart }}-{{ currentRangeEnd }} de {{ totalItems }}
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button
          type="button"
          class="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :disabled="currentPage >= totalPages || totalPages === 0"
          @click="currentPage++"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
