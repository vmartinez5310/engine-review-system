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
      class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <div
        :class="[
          'bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl w-full flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden shadow-2xl transition-all duration-300',
          maxWidth
        ]"
      >
        <div
          v-if="title || $slots['header-extra']"
          class="h-14 px-5 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center gap-4 shrink-0"
        >
          <div class="flex items-center gap-3 min-w-0">
            <slot name="header-icon" />
            <h3 class="text-xs font-mono tracking-[0.15em] uppercase text-slate-800 dark:text-slate-100 truncate">
              {{ title }}
            </h3>
            <slot name="header-extra" />
          </div>

          <button
            type="button"
            class="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors shrink-0"
            aria-label="Cerrar"
            @click="close"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 text-slate-700 dark:text-slate-300">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="h-14 px-5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30 shrink-0"
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
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
