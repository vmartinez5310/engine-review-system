<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../services/api'
import DataTable from '../components/ui/DataTable.vue'

const tracks = ref([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    tracks.value = await apiClient.post('get_tracking')
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
})

function enviarWhatsApp(item) {
  const text = encodeURIComponent(`Hola ${item.cliente}. Ayúdanos con tu reseña: ${item.url}`)
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
}
</script>

<template>
  <div class="h-full flex flex-col">
    <DataTable 
      :columns="[{key: 'fecha', label: 'Generado'}, {key: 'cliente', label: 'Cliente'}, {key: 'dias', label: 'Tiempo Transcurrido'}]"
      :data="tracks"
      :is-loading="isLoading">
      
      <template #cell-dias="{ item }">
        <span :class="item.dias >= 7 ? 'text-red-500 font-bold animate-pulse' : 'text-slate-500'">{{ item.dias }} días</span>
      </template>

      <template #actions="{ item }">
        <button @click="enviarWhatsApp(item)" class="text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-emerald-100">
          <i class="fab fa-whatsapp text-lg"></i> Recordar
        </button>
      </template>
    </DataTable>
  </div>
</template>