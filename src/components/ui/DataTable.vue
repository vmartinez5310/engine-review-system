<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  columns: Array,
  data: Array,
  isLoading: { type: Boolean, default: false },
  filterOptions: { type: Array, default: () => [] },
  filterColumnKey: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Buscar...' },
  mobilePreviewCount: { type: Number, default: 2 }
})

const emit = defineEmits(['row-action', 'row-click'])

const isColumnPickerOpen = ref(false)
const selectedColumns = ref([])

onMounted(() => {
  selectedColumns.value = props.columns
    .filter(c => !c.hidden)
    .map(c => c.key)
})

const activeColumns = computed(() => {
  return props.columns.filter(col => 
    col.required || selectedColumns.value.includes(col.key)
  )
})

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

const formattedFilterOptions = computed(() => {
  return [
    { label: 'Todos', value: 'all' },
    ...props.filterOptions.map(opt => ({ label: opt, value: opt }))
  ]
})

const filteredAndSortedData = computed(() => {
  let result = [...props.data]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(row => {
      return props.columns.some(col => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    })
  }

  if (selectedFilter.value !== 'all' && props.filterColumnKey) {
    result = result.filter(row => row[props.filterColumnKey] === selectedFilter.value)
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
  const end = start + itemsPerPage.value
  return filteredAndSortedData.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredAndSortedData.value.length / itemsPerPage.value))
const totalItems = computed(() => filteredAndSortedData.value.length)
const currentRangeStart = computed(() => totalItems.value === 0 ? 0 : ((currentPage.value - 1) * itemsPerPage.value) + 1)
const currentRangeEnd = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))

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
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors relative">
    
    <div class="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex flex-col sm:flex-row gap-3 justify-between items-center z-20">
      
      <div class="w-full sm:w-72 shrink-0">
        <BaseInput v-model="searchQuery" :placeholder="searchPlaceholder" icon="fas fa-search" />
      </div>
      
      <div class="flex w-full sm:w-auto gap-2 items-center">
        
        <div class="relative flex-none">
          <BaseButton variant="outline" icon="fas fa-columns" @click="isColumnPickerOpen = !isColumnPickerOpen" class="px-3">
            <span class="hidden sm:inline">Columnas</span>
            <i class="hidden sm:inline fas fa-chevron-down text-[10px] ml-1 opacity-50"></i>
          </BaseButton>

          <Transition name="fade">
            <div v-if="isColumnPickerOpen" class="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-2 overflow-hidden">
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2 pt-1">Mostrar Columnas</div>
              <div class="flex flex-col max-h-64 overflow-y-auto custom-scrollbar">
                <label v-for="col in columns" :key="col.key" class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors" :class="{'opacity-60 cursor-not-allowed': col.required}">
                  <input type="checkbox" :value="col.key" v-model="selectedColumns" :disabled="col.required" class="w-4 h-4 rounded text-brand border-slate-300 focus:ring-brand dark:border-slate-600 dark:bg-slate-900 transition-colors cursor-pointer disabled:cursor-not-allowed" />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300 select-none flex-1">{{ col.label }}</span>
                  <i v-if="col.required" class="fas fa-lock text-xs text-slate-400"></i>
                </label>
              </div>
            </div>
          </Transition>
        </div>

        <div v-if="filterOptions.length > 0" class="flex-1 sm:flex-none sm:w-40">
          <BaseSelect v-model="selectedFilter" :options="formattedFilterOptions" icon="fas fa-filter" />
        </div>
        
        <div class="flex-none">
          <slot name="header-actions"></slot>
        </div>
      </div>
    </div>

    <div v-if="isColumnPickerOpen" @click="isColumnPickerOpen = false" class="fixed inset-0 z-10"></div>

    <div class="flex-1 overflow-auto custom-scrollbar relative bg-slate-50/30 dark:bg-slate-900/20">
      
      <!-- VISTA DESKTOP -->
      <table class="min-w-full text-left text-sm whitespace-nowrap hidden md:table">
        <thead class="sticky top-0 z-10 bg-slate-50 dark:bg-[#0B1120] shadow-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold text-xs transition-colors border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th v-for="col in activeColumns" :key="col.key" class="px-6 py-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors group select-none" @click="handleSort(col.key)">
              <div class="flex items-center gap-2">
                {{ col.label }}
                <i class="fas fa-sort text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors" :class="{ 'text-brand dark:text-brand': sortColumn === col.key, 'fa-sort-up': sortColumn === col.key && sortAsc, 'fa-sort-down': sortColumn === col.key && !sortAsc }"></i>
              </div>
            </th>
            <th v-if="$slots.actions" class="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
          <tr v-if="isLoading" v-for="i in 5" :key="'skel'+i" class="animate-pulse">
            <td v-for="col in activeColumns" :key="'skel-td'+col.key" class="p-6">
              <div class="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
            </td>
            <td v-if="$slots.actions" class="p-6 flex justify-end"><div class="h-8 bg-slate-200 dark:bg-slate-700/50 rounded w-16"></div></td>
          </tr>
          
          <tr v-else-if="paginatedData.length === 0">
            <td :colspan="activeColumns.length + ($slots.actions ? 1 : 0)" class="py-12">
              <EmptyState icon="fas fa-search" title="No se encontraron registros" description="Intenta ajustando los filtros o el término de búsqueda." />
            </td>
          </tr>

          <tr v-else v-for="row in paginatedData" :key="row.id || row.fila" 
              @click="$emit('row-click', row)"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
            <td v-for="col in activeColumns" :key="col.key" class="px-6 py-4 text-slate-700 dark:text-slate-300">
              <slot :name="'cell-'+col.key" :item="row">{{ row[col.key] }}</slot>
            </td>
            <td v-if="$slots.actions" class="px-6 py-4 flex justify-end items-center gap-2" @click.stop>
              <slot name="actions" :item="row"></slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- VISTA MOBILE -->
      <div class="md:hidden p-3 sm:p-4 flex flex-col gap-3">
        
        <div v-if="isLoading" v-for="i in 3" :key="'skelm'+i" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 animate-pulse flex flex-col gap-3 shadow-sm">
          <div class="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-1/2"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
        </div>

        <div v-else-if="paginatedData.length === 0" class="py-10">
           <EmptyState icon="fas fa-search" title="Sin resultados" description="Intenta buscar otra cosa." />
        </div>

        <div v-else v-for="(row, index) in paginatedData" :key="row.id || row.fila || index" 
             @click="$emit('row-click', row)"
             class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col shadow-sm relative transition-all duration-300 cursor-pointer active:scale-[0.99]">
          
          <div class="flex flex-col gap-3">
            <div v-for="col in activeColumns.slice(0, mobilePreviewCount)" :key="col.key" class="flex flex-col">
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{{ col.label }}</span>
              <div class="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                <slot :name="'cell-'+col.key" :item="row">{{ row[col.key] }}</slot>
              </div>
            </div>
          </div>

          <Transition name="expand">
            <div v-show="expandedRows.includes(row.id || row.fila || index)">
              
              <div class="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-3">
                <div v-for="col in activeColumns.slice(mobilePreviewCount)" :key="col.key" class="flex flex-col">
                  <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{{ col.label }}</span>
                  <div class="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                    <slot :name="'cell-'+col.key" :item="row">{{ row[col.key] }}</slot>
                  </div>
                </div>
              </div>
              
              <div v-if="$slots.actions" class="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap justify-end gap-2" @click.stop>
                <slot name="actions" :item="row"></slot>
              </div>

            </div>
          </Transition>

          <button v-if="activeColumns.length > mobilePreviewCount || $slots.actions"
                  @click.stop="toggleRow(row.id || row.fila || index)"
                  class="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/30 text-xs font-bold text-brand hover:text-indigo-700 dark:hover:text-brand-light w-full text-center flex items-center justify-center gap-1.5 transition-colors outline-none">
            <span>{{ expandedRows.includes(row.id || row.fila || index) ? 'Ocultar detalles' : 'Leer más' }}</span>
            <i :class="expandedRows.includes(row.id || row.fila || index) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="text-[10px]"></i>
          </button>
          
        </div>
      </div>

    </div>

    <!-- PIE DE PÁGINA (PAGINACIÓN FAT FINGER) -->
    <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex items-center justify-between gap-4 transition-colors z-20">
      
      <div class="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Mostrar</span>
        <select v-model="itemsPerPage" class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-brand font-medium cursor-pointer min-h-[44px]">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
        </select>
      </div>

      <div class="text-sm text-slate-500 dark:text-slate-400 font-medium flex-1 sm:text-center text-left">
        <span class="sm:hidden text-xs">{{ currentRangeStart }} - {{ currentRangeEnd }} de {{ totalItems }}</span>
        <span class="hidden sm:inline">Mostrando {{ currentRangeStart }} al {{ currentRangeEnd }} de <strong class="text-slate-800 dark:text-slate-200">{{ totalItems }}</strong></span>
      </div>

      <div class="flex gap-2 shrink-0">
        <button @click="currentPage--" :disabled="currentPage === 1" 
          class="min-w-[44px] min-h-[44px] px-3 sm:px-5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2 active:scale-95 disabled:active:scale-100">
          <i class="fas fa-chevron-left text-[12px]"></i>
          <span class="hidden sm:inline">Anterior</span>
        </button>
        
        <button @click="currentPage++" :disabled="currentPage >= totalPages || totalPages === 0" 
          class="min-w-[44px] min-h-[44px] px-3 sm:px-5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2 active:scale-95 disabled:active:scale-100">
          <span class="hidden sm:inline">Siguiente</span>
          <i class="fas fa-chevron-right text-[12px]"></i>
        </button>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-5px); }

.expand-enter-active, .expand-leave-active { transition: all 0.3s ease-in-out; max-height: 800px; opacity: 1; overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; padding-top: 0; margin-top: 0; border-color: transparent; }
</style>