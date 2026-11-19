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
    <label v-if="label" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 select-none">
      {{ label }}
    </label>
    <div class="relative flex items-center">
      <div v-if="$slots.icon" class="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
        <slot name="icon" />
      </div>

      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :type="type"
        :placeholder="placeholder"
        :readonly="readonly"
        :class="[
          'w-full h-10 bg-white dark:bg-slate-900/60 border rounded-md outline-none transition-colors text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500',
          $slots.icon ? 'pl-9 pr-3' : 'px-3',
          error
            ? 'border-rose-500 focus:border-rose-500'
            : 'border-slate-200 dark:border-slate-800 focus:border-brand focus:ring-1 focus:ring-brand/20',
          readonly ? 'cursor-not-allowed opacity-60 bg-slate-50 dark:bg-slate-900/40' : ''
        ]"
      />
    </div>

    <p v-if="error" class="text-rose-500 text-xs mt-1">
      {{ error }}
    </p>
  </div>
</template>
