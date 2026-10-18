<script setup>
/**
 * DataTable visual contract (do not override from views):
 * - Shell: rounded-2xl border, full height flex column
 * - Toolbar: search (sm:w-72) | columns | filter chips | header-actions
 * - Desktop row: h-14, px-4, text-sm; sticky thead
 * - Mobile: card list, mobilePreviewCount fields visible
 * - Slots: header-actions, cell-{key}, actions
 * - Empty: EmptyState component only
 */
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
    result = result.filter((row) => row[props.filterColumnKey] === selectedFilter.value)
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

const skeletonRows = [1, 2, 3, 4, 5]
const skeletonMobile = [1, 2, 3]

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
  <div
    class="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors relative"
  >
    <!-- Toolbar -->
    <div
      class="h-14 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex gap-2 items-center z-20"
    >
      <div class="w-full sm:w-72 shrink-0 min-w-0">
        <BaseInput v-model="searchQuery" :placeholder="searchPlaceholder" icon="fas fa-search" />
      </div>

      <div class="flex gap-2 items-center ml-auto shrink-0">
        <div class="relative">
          <BaseButton
            variant="outline"
            icon="fas fa-columns"
            class="px-3"
            @click="isColumnPickerOpen = !isColumnPickerOpen"
          >
            <span class="hidden sm:inline">Columnas</span>
          </BaseButton>
          <Transition name="fade">
            <div
              v-if="isColumnPickerOpen"
              class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-2"
            >
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2 pt-1">
                Mostrar columnas
              </div>
              <div class="flex flex-col max-h-64 overflow-y-auto custom-scrollbar">
                <label
                  v-for="col in columns"
                  :key="col.key"
                  class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                  :class="{ 'opacity-60 cursor-not-allowed': col.required }"
                >
                  <input
                    v-model="selectedColumns"
                    type="checkbox"
                    :value="col.key"
                    :disabled="col.required"
                    class="w-4 h-4 rounded text-brand border-slate-300 focus:ring-brand"
                  />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">{{ col.label }}</span>
                  <i v-if="col.required" class="fas fa-lock text-xs text-slate-400" />
                </label>
              </div>
            </div>
          </Transition>
        </div>

        <div class="flex-none">
          <slot name="header-actions" />
        </div>
      </div>
    </div>

    <!-- Filter chips -->
    <div
      v-if="filterOptions.length > 0"
      class="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-1.5 shrink-0 bg-white dark:bg-slate-800"
    >
      <button
        type="button"
        class="h-8 px-3 rounded-full text-xs font-semibold transition-colors"
        :class="
          selectedFilter === 'all'
            ? 'bg-brand text-white'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        "
        @click="selectedFilter = 'all'"
      >
        Todos
      </button>
      <button
        v-for="opt in filterOptions"
        :key="opt"
        type="button"
        class="h-8 px-3 rounded-full text-xs font-semibold transition-colors"
        :class="
          selectedFilter === opt
            ? 'bg-brand text-white'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        "
        @click="selectedFilter = opt"
      >
        {{ opt }}
      </button>
    </div>

    <div v-if="isColumnPickerOpen" class="fixed inset-0 z-10" @click="isColumnPickerOpen = false" />

    <div class="flex-1 overflow-auto custom-scrollbar relative bg-slate-50/30 dark:bg-slate-900/20">
      <!-- Desktop -->
      <table class="min-w-full text-left text-sm whitespace-nowrap hidden md:table">
        <thead
          class="sticky top-0 z-10 bg-slate-50 dark:bg-[#0B1120] shadow-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold text-xs border-b border-slate-200 dark:border-slate-700"
        >
          <tr class="h-12">
            <th
              v-for="col in activeColumns"
              :key="col.key"
              class="px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white select-none"
              @click="handleSort(col.key)"
            >
              <div class="flex items-center gap-2">
                {{ col.label }}
                <i
                  class="fas fa-sort text-slate-300 dark:text-slate-600"
                  :class="{
                    'text-brand': sortColumn === col.key,
                    'fa-sort-up': sortColumn === col.key && sortAsc,
                    'fa-sort-down': sortColumn === col.key && !sortAsc
                  }"
                />
              </div>
            </th>
            <th v-if="$slots.actions" class="px-4 text-right">Acciones</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
          <template v-if="isLoading">
            <tr v-for="i in skeletonRows" :key="'skel' + i" class="h-14 animate-pulse">
              <td v-for="col in activeColumns" :key="'skel-td' + col.key" class="px-4">
                <div class="h-3.5 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4" />
              </td>
              <td v-if="$slots.actions" class="px-4">
                <div class="h-8 bg-slate-200 dark:bg-slate-700/50 rounded w-16 ml-auto" />
              </td>
            </tr>
          </template>

          <tr v-else-if="paginatedData.length === 0">
            <td :colspan="activeColumns.length + ($slots.actions ? 1 : 0)" class="py-12">
              <EmptyState
                icon="fas fa-search"
                title="No se encontraron registros"
                description="Intenta ajustando los filtros o el término de búsqueda."
              />
            </td>
          </tr>

          <tr
            v-for="(row, index) in paginatedData"
            v-else
            :key="rowKey(row, index)"
            class="h-14 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
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

      <!-- Mobile -->
      <div class="md:hidden p-3 flex flex-col gap-3">
        <template v-if="isLoading">
          <div
            v-for="i in skeletonMobile"
            :key="'skelm' + i"
            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 animate-pulse flex flex-col gap-3 min-h-[88px]"
          >
            <div class="h-3.5 bg-slate-200 dark:bg-slate-700/50 rounded w-1/2" />
            <div class="h-3.5 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4" />
          </div>
        </template>

        <div v-else-if="paginatedData.length === 0" class="py-10">
          <EmptyState icon="fas fa-search" title="Sin resultados" description="Intenta buscar otra cosa." />
        </div>

        <div
          v-for="(row, index) in paginatedData"
          v-else
          :key="rowKey(row, index)"
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col shadow-sm cursor-pointer active:scale-[0.99]"
          @click="$emit('row-click', row)"
        >
          <div class="flex flex-col gap-3">
            <div
              v-for="col in activeColumns.slice(0, mobilePreviewCount)"
              :key="col.key"
              class="flex flex-col"
            >
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ col.label }}</span>
              <div class="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                <slot :name="'cell-' + col.key" :item="row">{{ row[col.key] }}</slot>
              </div>
            </div>
          </div>

          <Transition name="expand">
            <div v-show="expandedRows.includes(rowKey(row, index))">
              <div class="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-3">
                <div
                  v-for="col in activeColumns.slice(mobilePreviewCount)"
                  :key="col.key"
                  class="flex flex-col"
                >
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ col.label }}</span>
                  <div class="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                    <slot :name="'cell-' + col.key" :item="row">{{ row[col.key] }}</slot>
                  </div>
                </div>
              </div>
              <div
                v-if="$slots.actions"
                class="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap justify-end gap-2"
                @click.stop
              >
                <slot name="actions" :item="row" />
              </div>
            </div>
          </Transition>

          <button
            v-if="activeColumns.length > mobilePreviewCount || $slots.actions"
            type="button"
            class="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/30 text-xs font-bold text-brand w-full text-center flex items-center justify-center gap-1.5"
            @click.stop="toggleRow(rowKey(row, index))"
          >
            <span>{{ expandedRows.includes(rowKey(row, index)) ? 'Ocultar detalles' : 'Leer más' }}</span>
            <i
              :class="expandedRows.includes(rowKey(row, index)) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
              class="text-[10px]"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Footer pagination -->
    <div
      class="h-14 px-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex items-center justify-between gap-4 z-20"
    >
      <div class="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Mostrar</span>
        <select
          v-model="itemsPerPage"
          class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand font-medium cursor-pointer"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
        </select>
      </div>

      <div class="text-sm text-slate-500 dark:text-slate-400 font-medium flex-1 sm:text-center text-left">
        <span class="sm:hidden text-xs">{{ currentRangeStart }} - {{ currentRangeEnd }} de {{ totalItems }}</span>
        <span class="hidden sm:inline">
          Mostrando {{ currentRangeStart }} al {{ currentRangeEnd }} de
          <strong class="text-slate-800 dark:text-slate-200">{{ totalItems }}</strong>
        </span>
      </div>

      <div class="flex gap-2 shrink-0">
        <button
          type="button"
          class="min-w-[40px] h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fas fa-chevron-left text-[12px]" />
          <span class="hidden sm:inline">Anterior</span>
        </button>
        <button
          type="button"
          class="min-w-[40px] h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          :disabled="currentPage >= totalPages || totalPages === 0"
          @click="currentPage++"
        >
          <span class="hidden sm:inline">Siguiente</span>
          <i class="fas fa-chevron-right text-[12px]" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 800px;
  opacity: 1;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  margin-top: 0;
  border-color: transparent;
}
</style>
