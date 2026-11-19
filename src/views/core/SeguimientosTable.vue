<script setup>
import { hasPermission } from '../../composables/useAuth'
import BaseButton from '../../components/ui/BaseButton.vue'
import StatusBadge from '../../components/ui/StatusBadge.vue'

defineProps({
  data: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

defineEmits(['open-modal', 'row-click', 'revoke'])

const columns = [
  { key: 'id', label: 'ID', hidden: true },
  { key: 'fecha', label: 'Generado' },
  { key: 'cliente', label: 'Cliente', required: true },
  { key: 'servicio', label: 'Servicio' },
  { key: 'dias', label: 'Transcurrido' },
  { key: 'asesor', label: 'Asesor', hidden: true },
  { key: 'estado', label: 'Estado', required: true }
]

const filterOptions = ['Activo', 'Usado', 'Expirado', 'Revocado']
</script>

<template>
  <DataTable
    :mobile-preview-count="3"
    :columns="columns"
    :data="data"
    :is-loading="isLoading"
    search-placeholder="Buscar cliente o servicio..."
    :filter-options="filterOptions"
    filter-column-key="estado"
    @row-click="$emit('row-click', $event)"
  >
    <template #header-actions>
      <BaseButton
        v-if="hasPermission('generar_enlace')"
        @click="$emit('open-modal')"
      >
        <template #icon>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </template>
        <span class="hidden sm:inline">Nueva invitación</span>
      </BaseButton>
    </template>

    <template #cell-dias="{ item }">
      <span
        class="text-xs tabular-nums"
        :class="item.estado === 'Expirado' || item.dias >= 7 ? 'text-rose-500 font-medium' : 'text-slate-600 dark:text-slate-400'"
      >
        {{ item.dias === 0 ? 'Hoy' : `${item.dias} días` }}
      </span>
    </template>

    <template #cell-estado="{ item }">
      <StatusBadge :status="item.estado" />
    </template>

    <template #actions="{ item }">
      <button
        v-if="item.estado === 'Activo' && hasPermission('editar_resena')"
        type="button"
        class="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
        title="Inhabilitar enlace"
        @click.stop="$emit('revoke', item)"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      </button>
    </template>
  </DataTable>
</template>
