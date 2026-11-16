<script setup>
import { hasPermission } from '../../composables/useAuth'

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
  <SkeletonBlock v-if="isLoading" variant="tokens" :rows="6" />
  <DataTable
    v-else
    :mobile-preview-count="3"
    :columns="columns"
    :data="data"
    :is-loading="false"
    search-placeholder="Buscar cliente o servicio..."
    :filter-options="filterOptions"
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

    <template #cell-dias="{ item }">
      <span
        class="text-xs font-semibold tabular-nums"
        :class="
          item.estado === 'Expirado' || item.dias >= 7
            ? 'text-red-500 dark:text-red-400'
            : 'text-slate-600 dark:text-slate-400'
        "
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
        class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        title="Revocar enlace"
        @click.stop="$emit('revoke', item)"
      >
        <i class="fas fa-ban text-xs" />
      </button>
    </template>
  </DataTable>
</template>
