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
    { key: 'legalOk', label: 'LEGAL', hidden: true },
    { key: 'calificacion', label: 'Calif.', required: true },
    { key: 'comentario', label: 'Reseña' },
    { key: 'estado', label: 'Estado', required: true }
  ]
  if (hasPermission('editar_resena')) {
    base.push({ key: 'respuesta', label: 'Respuesta', hidden: true })
  }
  return base
})
</script>

<template>
  <SkeletonBlock v-if="isLoading" variant="table" :rows="6" />
  <DataTable
    v-else
    :mobile-preview-count="3"
    :columns="columns"
    :data="data"
    :is-loading="false"
    search-placeholder="Buscar en reseñas..."
    :filter-options="['Pendiente', 'Aprobado', 'Archivado']"
    filter-column-key="estado"
    @row-click="$emit('row-click', $event)"
  >
    <template #header-actions>
      <BaseButton
        v-if="hasPermission('generar_enlace')"
        icon="fas fa-plus"
        @click="$emit('open-modal')"
      >
        <span class="hidden sm:inline ml-1">Pedir Reseña</span>
      </BaseButton>
    </template>

    <template #cell-calificacion="{ item }">
      <BaseStarRating :score="Number(item.calificacion)" />
    </template>

    <template #cell-comentario="{ item }">
      <div class="max-w-[140px] 2xl:max-w-[240px] truncate text-slate-700 dark:text-slate-300">
        {{ item.comentario }}
      </div>
    </template>

    <template #cell-legalOk="{ item }">
      <div class="text-center">
        <i v-if="item.legalOk" class="fas fa-check-circle text-emerald-500"></i>
        <i v-else class="fas fa-minus text-slate-300"></i>
      </div>
    </template>

    <template #cell-respuesta="{ item }">
      <div
        v-if="item.respuesta"
        class="max-w-[140px] 2xl:max-w-[240px] truncate text-slate-700 dark:text-slate-300"
      >
        {{ item.respuesta }}
      </div>
      <span v-else class="text-slate-400 italic text-[11px]">Sin respuesta</span>
    </template>

    <template #cell-estado="{ item }">
      <StatusBadge :status="item.estado" />
    </template>
  </DataTable>
</template>
