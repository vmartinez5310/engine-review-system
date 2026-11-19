<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  readonly: { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 select-none">
      {{ label }}
    </label>
    <div class="relative flex items-center">
      <div v-if="$slots.icon" class="absolute left-3 text-slate-400 pointer-events-none flex items-center">
        <slot name="icon" />
      </div>

      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :type="type"
        :placeholder="placeholder"
        :readonly="readonly"
        :class="[
          'w-full h-10 bg-white dark:bg-slate-900/60 border rounded-full outline-none transition-colors text-base sm:text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand',
          $slots.icon ? 'pl-9 pr-3' : 'px-3.5',
          error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800',
          readonly ? 'cursor-not-allowed opacity-60 bg-slate-50 dark:bg-slate-900/40' : ''
        ]"
      />
    </div>

    <p v-if="error" class="text-rose-500 text-xs mt-1 transition-opacity">
      {{ error }}
    </p>
  </div>
</template>
