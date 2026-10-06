<template>
  <div class="relative">
    <input
      :id="id"
      :value="modelValue"
      :name="name"
      :type="visible ? 'text' : 'password'"
      :required="required"
      :minlength="minlength"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      spellcheck="false"
      :aria-describedby="describedby"
      class="field pr-16"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      type="button"
      :aria-pressed="visible ? 'true' : 'false'"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      class="absolute inset-y-0 right-0 px-3 text-sm font-medium text-ink-soft hover:text-ink"
      @click="visible = !visible"
    >
      {{ visible ? "Hide" : "Show" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

withDefaults(
  defineProps<{
    id: string;
    modelValue: string;
    name?: string;
    required?: boolean;
    minlength?: number | string;
    autocomplete?: string;
    placeholder?: string;
    describedby?: string;
  }>(),
  { required: true }
);

defineEmits<{ "update:modelValue": [value: string] }>();

const visible = ref(false);
</script>
