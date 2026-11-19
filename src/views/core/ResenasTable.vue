<script setup>
import { computed } from 'vue'
import { hasPermission } from '../../composables/useAuth'

const props = defineProps({
  data: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['open-modal', 'row-click'])

const columns = computed(() => {
  const base = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'cliente', label: 'Cliente', required: true },
    { key: 'servicio', label: 'Servicio', hidden: true },
    { key: 'calificacion', label: 'Score', required: true },
    { key: 'comentario', label: 'Testimonio' },
    { key: 'estado', label: 'Estado', required: true }
  ]
  if (hasPermission('editar_resena')) {
    base.push({ key: 'respuesta', label: 'Respuesta', hidden: true })
  }
  return base
})
</script>

<template>
  <DataTable
    :mobile-preview-count="3"
    :columns="columns"
    :data="data"
    :is-loading="isLoading"
    search-placeholder="Buscar reseña o cliente..."
    :filter-options="['Pendiente', 'Aprobado', 'Archivado']"
    filter-column-key="estado"
    @row-click="$emit('row-click', $event)"
  >
    <template #header-actions>
      <BaseButton
        v-if="hasPermission('generar_enlace')"
        @click="$emit('open-modal')"
      >
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </template>
        <span class="hidden sm:inline">Nueva Invitación</span>
      </BaseButton>
    </template>

    <template #cell-fecha="{ item }">
      <span class="font-mono text-[11px] text-slate-400 tabular-nums">{{ item.fecha }}</span>
    </template>

    <template #cell-cliente="{ item }">
      <span class="font-normal text-slate-900 dark:text-slate-100">{{ item.cliente }}</span>
    </template>

    <template #cell-calificacion="{ item }">
      <div class="flex items-center gap-1">
        <svg
          v-for="i in 5"
          :key="i"
          class="w-3 h-3"
          :class="i <= Number(item.calificacion) ? 'text-amber-400 fill-amber-400/20' : 'text-slate-300 dark:text-slate-700'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>
    </template>

    <template #cell-comentario="{ item }">
      <div class="max-w-[200px] 2xl:max-w-[320px] truncate text-slate-500 dark:text-slate-400 font-light italic">
        "{{ item.comentario || 'Sin comentario adicional' }}"
      </div>
    </template>

    <template #cell-respuesta="{ item }">
      <div v-if="item.respuesta" class="max-w-[180px] truncate text-slate-500 font-light">
        {{ item.respuesta }}
      </div>
      <span v-else class="text-slate-400 font-mono text-[10px]">—</span>
    </template>

    <template #cell-estado="{ item }">
      <span
        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border"
        :class="{
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20': String(item.estado).toUpperCase() === 'APROBADO',
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20': String(item.estado).toUpperCase() === 'PENDIENTE',
          'bg-slate-500/10 text-slate-500 border-slate-500/20': String(item.estado).toUpperCase() === 'ARCHIVADO'
        }"
      >
        <span class="w-1 h-1 rounded-full" :class="{
          'bg-emerald-500': String(item.estado).toUpperCase() === 'APROBADO',
          'bg-amber-500': String(item.estado).toUpperCase() === 'PENDIENTE',
          'bg-slate-400': String(item.estado).toUpperCase() === 'ARCHIVADO'
        }"></span>
        {{ item.estado }}
      </span>
    </template>
  </DataTable>
</template>
