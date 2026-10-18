<script setup>
import { defineAsyncComponent, h } from 'vue'
import SkeletonBlock from '../../components/ui/SkeletonBlock.vue'

defineProps({
  activeSubTab: { type: String, default: 'perfil' }
})

const createAsyncTab = (loader, variant, rows = 4) =>
  defineAsyncComponent({
    loader,
    loadingComponent: () => h(SkeletonBlock, { variant, rows }),
    delay: 0
  })

const ConfigPerfil = createAsyncTab(() => import('../user/PerfilView.vue'), 'bento', 8)
const ConfigUsuarios = createAsyncTab(() => import('./UsuariosView.vue'), 'tokens', 6)
const ConfigApariencia = createAsyncTab(() => import('./SistemaView.vue'), 'bento', 8)
</script>

<template>
  <div class="h-full w-full flex flex-col relative overflow-y-auto lg:overflow-hidden">
    <Transition name="fade" mode="out-in">
      <ConfigPerfil v-if="activeSubTab === 'perfil'" class="flex-1 min-h-0 w-full" />
      <ConfigUsuarios v-else-if="activeSubTab === 'usuarios'" class="flex-1 min-h-0 w-full" />
      <ConfigApariencia v-else-if="activeSubTab === 'apariencia'" class="flex-1 min-h-0 w-full" />
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>