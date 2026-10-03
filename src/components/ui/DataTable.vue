<script setup>
import { ref, computed, watch, onMounted } from 'vue' // Añadido onMounted

const props = defineProps({
  columns: Array,
  data: Array,
  isLoading: { type: Boolean, default: false },
  filterOptions: { type: Array, default: () => [] },
  filterColumnKey: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Buscar...' }
})

const emit = defineEmits(['row-action'])
const isColumnPickerOpen = ref(false)

const selectedColumns = ref([])

onMounted(() => {
  // Al iniciar, activamos todas las columnas por defecto
  selectedColumns.value = props.columns.map(c => c.key)
})

const activeColumns = computed(() => {
  return props.columns.filter(col => 
    col.required || selectedColumns.value.includes(col.key)
  )
})

// --- ESTADOS LOCALES ---
const searchQuery = ref('')
const selectedFilter = ref('all')
const itemsPerPage = ref(10)
const currentPage = ref(1)
const sortColumn = ref('')
const sortAsc = ref(true)

// Resetea la página si el usuario busca o filtra
watch([searchQuery, selectedFilter, itemsPerPage], () => {
  currentPage.value = 1
})

// --- LÓGICA DE DATOS COMPUTADA ---
const filteredAndSortedData = computed(() => {
  let result = [...props.data]

  // 1. Buscador global
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(row => {
      return props.columns.some(col => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    })
  }

  // 2. Filtro Select
  if (selectedFilter.value !== 'all' && props.filterColumnKey) {
    result = result.filter(row => row[props.filterColumnKey] === selectedFilter.value)
  }

  // 3. Ordenamiento
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

// 4. Paginación
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredAndSortedData.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredAndSortedData.value.length / itemsPerPage.value))
const totalItems = computed(() => filteredAndSortedData.value.length)
const currentRangeStart = computed(() => totalItems.value === 0 ? 0 : ((currentPage.value - 1) * itemsPerPage.value) + 1)
const currentRangeEnd = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))

// --- MÉTODOS ---
function handleSort(colKey) {
  if (sortColumn.value === colKey) {
    sortAsc.value = !sortAsc.value
  } else {
    sortColumn.value = colKey
    sortAsc.value = true
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors relative">
    
    <!-- CONTROLES SUPERIORES (Fijos) -->
    <div class="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex flex-col md:flex-row gap-4 justify-between items-center">
      
      <!-- Buscador Global -->
      <div class="relative w-full md:w-80">
        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          :placeholder="searchPlaceholder" 
          class="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand outline-none transition dark:text-white dark:placeholder-slate-500 shadow-sm"
        >
      </div>
      
      <!-- Combobox de Columnas y Filtros -->
      <div class="flex w-full md:w-auto gap-3 items-center">
        
        <!-- Menú Columnas -->
        <div class="relative">
          <button @click="isColumnPickerOpen = !isColumnPickerOpen" 
            class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            <i class="fas fa-columns text-slate-400"></i>
            <span class="hidden sm:inline">Columnas</span>
            <i class="fas fa-chevron-down text-xs ml-1 text-slate-400"></i>
          </button>

          <!-- Dropdown Flotante -->
          <Transition name="fade">
            <div v-if="isColumnPickerOpen" 
              class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2 overflow-hidden">
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2 pt-1">Mostrar/Ocultar</div>
              
              <div class="flex flex-col max-h-64 overflow-y-auto custom-scrollbar">
                <label v-for="col in columns" :key="col.key" 
                  class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  :class="{'opacity-60 cursor-not-allowed': col.required}">
                  
                  <input type="checkbox" 
                    :value="col.key" 
                    v-model="selectedColumns"
                    :disabled="col.required"
                    class="w-4 h-4 rounded text-brand border-slate-300 focus:ring-brand dark:border-slate-600 dark:bg-slate-900 transition-colors cursor-pointer disabled:cursor-not-allowed" />
                  
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300 select-none flex-1">
                    {{ col.label }}
                  </span>
                  
                  <i v-if="col.required" class="fas fa-lock text-xs text-slate-400"></i>
                </label>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Selector de Filtro -->
        <select 
          v-if="filterOptions.length > 0" 
          v-model="selectedFilter" 
          class="flex-1 md:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand cursor-pointer shadow-sm"
        >
          <option value="all">Todos</option>
          <option v-for="opt in filterOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        
        <slot name="header-actions"></slot>
      </div>
    </div>

    <!-- Capa invisible para cerrar el dropdown -->
    <div v-if="isColumnPickerOpen" @click="isColumnPickerOpen = false" class="fixed inset-0 z-40"></div>

    <!-- ÁREA DE TABLA -->
    <div class="flex-1 overflow-auto custom-scrollbar relative">
      <table class="min-w-full text-left text-sm whitespace-nowrap hidden md:table">
        <!-- CABECERA FIJA -->
        <thead class="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/95 backdrop-blur shadow-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold text-xs transition-colors">
          <tr>
            <!-- Usamos activeColumns aquí -->
            <th 
              v-for="col in activeColumns" 
              :key="col.key" 
              class="px-6 py-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors group select-none"
              @click="handleSort(col.key)"
            >
              <div class="flex items-center gap-2">
                {{ col.label }}
                <i class="fas fa-sort text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors"
                   :class="{ 'text-brand dark:text-brand': sortColumn === col.key, 'fa-sort-up': sortColumn === col.key && sortAsc, 'fa-sort-down': sortColumn === col.key && !sortAsc }">
                </i>
              </div>
            </th>
            <th class="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        
        <!-- REGISTROS -->
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
          <!-- Estado de Carga -->
          <tr v-if="isLoading" v-for="i in 5" :key="'skel'+i" class="animate-pulse">
            <td v-for="col in activeColumns" :key="'skel-td'+col.key" class="p-4">
              <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </td>
            <td class="p-4 flex justify-end">
              <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
            </td>
          </tr>
          
          <!-- Sin resultados -->
          <tr v-else-if="paginatedData.length === 0">
            <td :colspan="activeColumns.length + 1" class="py-12 text-center text-slate-400 dark:text-slate-500">
              <i class="fas fa-folder-open text-3xl mb-3 opacity-50"></i>
              <p>No se encontraron registros que coincidan con tu búsqueda.</p>
            </td>
          </tr>

          <!-- Datos Reales -->
          <tr v-else v-for="row in paginatedData" :key="row.id || row.fila" class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <!-- Usamos activeColumns aquí -->
            <td v-for="col in activeColumns" :key="col.key" class="px-6 py-4 text-slate-700 dark:text-slate-300">
              <slot :name="'cell-'+col.key" :item="row">{{ row[col.key] }}</slot>
            </td>
            
            <td class="px-6 py-4 flex justify-end items-center gap-2">
              <slot name="actions" :item="row"></slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- VISTA MOBILE (CARDS) -->
      <div class="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700/50">
        <div v-for="row in paginatedData" :key="row.id || row.fila" class="p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
          <!-- Usamos activeColumns aquí -->
          <div v-for="col in activeColumns" :key="col.key" class="flex flex-col">
            <span class="text-[10px] font-bold text-slate-400 uppercase">{{ col.label }}</span>
            <div class="text-sm text-slate-700 dark:text-slate-300 mt-1">
              <slot :name="'cell-'+col.key" :item="row">{{ row[col.key] }}</slot>
            </div>
          </div>
          <div class="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-2">
            <slot name="actions" :item="row"></slot>
          </div>
        </div>
      </div>
    </div>

    <!-- PIE DE PÁGINA -->
    <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400 transition-colors">
      <div class="flex items-center gap-2">
        <span>Mostrar</span>
        <select v-model="itemsPerPage" class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-brand">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
        <span>registros</span>
      </div>

      <div class="font-medium">
        Mostrando {{ currentRangeStart }} al {{ currentRangeEnd }} de <strong class="text-slate-800 dark:text-slate-200">{{ totalItems }}</strong>
      </div>

      <div class="flex gap-2">
        <button @click="currentPage--" :disabled="currentPage === 1" class="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-1">
          <i class="fas fa-chevron-left text-xs"></i> Anterior
        </button>
        <button @click="currentPage++" :disabled="currentPage >= totalPages || totalPages === 0" class="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-1">
          Siguiente <i class="fas fa-chevron-right text-xs"></i>
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
</style>