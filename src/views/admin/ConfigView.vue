<script setup>
import { defineAsyncComponent } from 'vue'

const props = defineProps({ 
  activeSubTab: { type: String, default: 'perfil' } 
})

// Importación perezosa: Carga los componentes de forma atómica solo cuando se necesitan
const ConfigPerfil = defineAsyncComponent(() => import('../user/PerfilView.vue'))
const ConfigUsuarios = defineAsyncComponent(() => import('./UsuariosView.vue')) // Está en la misma carpeta (admin)
const ConfigApariencia = defineAsyncComponent(() => import('./SistemaView.vue')) // Lo llamamos SistemaView
</script>

<template>
  <div class="h-full flex flex-col relative w-full max-w-4xl mx-auto">
    <Transition name="fade" mode="out-in">
      <ConfigPerfil v-if="activeSubTab === 'perfil'" />
      <ConfigUsuarios v-else-if="activeSubTab === 'usuarios'" />
      <ConfigApariencia v-else-if="activeSubTab === 'apariencia'" />
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(5px); }
</style>