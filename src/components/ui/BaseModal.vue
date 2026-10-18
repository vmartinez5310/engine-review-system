<script setup>
/**
 * Presentational modal chrome only.
 * Slots: default (body), header-icon, footer.
 * No domain fields or API calls.
 */
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
      class="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <div
        :class="[
          'bg-white dark:bg-slate-800 rounded-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]',
          maxWidth
        ]"
      >
        <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
          <h3 class="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <slot name="header-icon" />
            {{ title }}
          </h3>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Cerrar"
            @click="close"
          >
            <i class="fas fa-times text-xl" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto custom-scrollbar">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="p-5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50 shrink-0 rounded-b-2xl"
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
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
