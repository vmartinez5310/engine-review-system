<script setup>
defineProps({
  title: { type: String, default: '' },
  maxWidth: { type: String, default: 'max-w-md' }
})

const open = defineModel({ type: Boolean, required: true })

function close() {
  open.value = false
}
</script>

<template>
  <Transition name="fade-modal">
    <div
      v-if="open"
      class="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-2.5 sm:p-4 z-[100] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <div
        :class="[
          'bg-white dark:bg-slate-900 rounded-2xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden',
          maxWidth
        ]"
      >
        <!-- HEADER COMPACTO -->
        <div
          v-if="title || $slots['header-extra']"
          class="px-4 py-3.5 sm:px-5 border-b border-slate-100 dark:border-slate-800/90 flex justify-between items-center gap-3 shrink-0"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <slot name="header-icon" />
            <h3 class="font-bold text-sm sm:text-base text-slate-800 dark:text-white truncate">
              {{ title }}
            </h3>
            <slot name="header-extra" />
          </div>

          <button
            type="button"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Cerrar"
            @click="close"
          >
            <i class="fas fa-times text-sm" />
          </button>
        </div>

        <!-- BODY ADAPTABLE -->
        <div class="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <slot />
        </div>

        <!-- FOOTER COMPACTO -->
        <div
          v-if="$slots.footer"
          class="px-4 py-3 sm:px-5 border-t border-slate-100 dark:border-slate-800/90 flex items-center justify-between gap-2.5 bg-slate-50/60 dark:bg-slate-950/40 shrink-0"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(4px);
}
</style>