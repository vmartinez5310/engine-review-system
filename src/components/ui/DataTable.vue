<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  // Permite pasar una lista de filtros (ej. ['Pendiente', 'Aprobado']) y la columna a la que aplican
  filterOptions: { type: Array, default: () => [] },
  filterColumnKey: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Buscar...' }
})

const emit = defineEmits(['row-action'])

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

  // 1. Buscador global (Busca en TODAS las columnas visibles)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(row => {
      return props.columns.some(col => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    })
  }

  // 2. Filtro Select (ej. Estado)
  if (selectedFilter.value !== 'all' && props.filterColumnKey) {
    result = result.filter(row => row[props.filterColumnKey] === selectedFilter.value)
  }

  // 3. Ordenamiento (Sort)
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
    sortAsc.value = !sortAsc.value // Invierte el orden
  } else {
    sortColumn.value = colKey
    sortAsc.value = true
  }
}
</script>

<template>
  <!-- Contenedor Flex para ocupar el alto disponible (Requisito 7) -->
  <div class="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
    
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
      
      <!-- Filtro y Botón (Slots para flexibilidad) -->
      <div class="flex w-full md:w-auto gap-3 items-center">
        <!-- Selector de Filtro (Requisito 1) -->
        <select 
          v-if="filterOptions.length > 0" 
          v-model="selectedFilter" 
          class="flex-1 md:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand cursor-pointer shadow-sm"
        >
          <option value="all">Todos</option>
          <option v-for="opt in filterOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        
        <!-- Slot para añadir botones externos (Ej. Generar Link) -->
        <slot name="header-actions"></slot>
      </div>
    </div>

    <!-- ÁREA DE TABLA CON SCROLL INTERNO (Requisito 5 y 7) -->
    <div class="flex-1 overflow-auto custom-scrollbar relative">
      <table class="min-w-full text-left text-sm whitespace-nowrap">
        <!-- CABECERA FIJA (Requisito 7) -->
        <thead class="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/95 backdrop-blur shadow-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold text-xs transition-colors">
          <tr>
            <th 
              v-for="col in columns" 
              :key="col.key" 
              class="px-6 py-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors group select-none"
              @click="handleSort(col.key)"
            >
              <div class="flex items-center gap-2">
                {{ col.label }}
                <!-- Icono de ordenamiento (Requisito 4) -->
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
            <td v-for="col in columns" :key="'skel-td'+col.key" class="p-4">
              <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </td>
            <td class="p-4 flex justify-end">
              <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
            </td>
          </tr>
          
          <!-- Sin resultados -->
          <tr v-else-if="paginatedData.length === 0">
            <td :colspan="columns.length + 1" class="py-12 text-center text-slate-400 dark:text-slate-500">
              <i class="fas fa-folder-open text-3xl mb-3 opacity-50"></i>
              <p>No se encontraron registros que coincidan con tu búsqueda.</p>
            </td>
          </tr>

          <!-- Datos Reales -->
          <tr v-else v-for="row in paginatedData" :key="row.id || row.fila" class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            
            <td v-for="col in columns" :key="col.key" class="px-6 py-4 text-slate-700 dark:text-slate-300">
              <!-- Permitimos inyectar HTML personalizado por columna desde la vista padre -->
              <slot :name="'cell-'+col.key" :item="row">{{ row[col.key] }}</slot>
            </td>
            
            <!-- Acciones -->
            <td class="px-6 py-4 flex justify-end items-center gap-2">
              <slot name="actions" :item="row"></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PIE DE PÁGINA (Paginación y Selectores) (Requisito 6 y 7) -->
    <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400 transition-colors">
      
      <!-- Selector de cantidad -->
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

      <!-- Info de registros -->
      <div class="font-medium">
        Mostrando {{ currentRangeStart }} al {{ currentRangeEnd }} de <strong class="text-slate-800 dark:text-slate-200">{{ totalItems }}</strong>
      </div>

      <!-- Botones de Paginación -->
      <div class="flex gap-2">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-1"
        >
          <i class="fas fa-chevron-left text-xs"></i> Anterior
        </button>
        <button 
          @click="currentPage++" 
          :disabled="currentPage >= totalPages || totalPages === 0"
          class="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-1"
        >
          Siguiente <i class="fas fa-chevron-right text-xs"></i>
        </button>
      </div>
    </div>

  </div>
</template>