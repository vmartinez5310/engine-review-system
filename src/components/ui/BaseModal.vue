<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, required: true },
  maxWidth: { type: String, default: 'max-w-md' }
})
const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Transition name="fade-modal">
    <div v-if="modelValue" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div :class="['bg-white dark:bg-slate-800 rounded-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]', maxWidth]">
        
        <!-- Header Fijo -->
        <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
          <h3 class="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <slot name="header-icon"></slot>
            {{ title }}
          </h3>
          <button @click="close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Body con Scroll Automático -->
        <div class="p-6 overflow-y-auto custom-scrollbar">
          <slot></slot>
        </div>

        <!-- Footer Opcional -->
        <div v-if="$slots.footer" class="p-5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50 shrink-0 rounded-b-2xl">
          <slot name="footer"></slot>
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